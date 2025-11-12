<?php
/**
 * Admin Settings
 */

if (!defined('ABSPATH')) {
    exit;
}

class HSI_Admin_Settings {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
    }
    
    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'Headless Stripe',
            'Headless Stripe',
            'manage_woocommerce',
            'headless-stripe-integration',
            [$this, 'admin_page']
        );
    }
    
    public function register_settings() {
        register_setting('hsi_settings', 'hsi_test_mode');
        register_setting('hsi_settings', 'hsi_test_publishable_key');
        register_setting('hsi_settings', 'hsi_test_secret_key');
        register_setting('hsi_settings', 'hsi_live_publishable_key');
        register_setting('hsi_settings', 'hsi_live_secret_key');
        register_setting('hsi_settings', 'hsi_webhook_secret');
    }
    
    public function admin_page() {
        if (isset($_POST['hsi_save_settings'])) {
            check_admin_referer('hsi_settings');
            
            update_option('hsi_test_mode', $_POST['hsi_test_mode'] ?? 'yes');
            update_option('hsi_test_publishable_key', sanitize_text_field($_POST['hsi_test_publishable_key'] ?? ''));
            update_option('hsi_test_secret_key', sanitize_text_field($_POST['hsi_test_secret_key'] ?? ''));
            update_option('hsi_live_publishable_key', sanitize_text_field($_POST['hsi_live_publishable_key'] ?? ''));
            update_option('hsi_live_secret_key', sanitize_text_field($_POST['hsi_live_secret_key'] ?? ''));
            update_option('hsi_webhook_secret', sanitize_text_field($_POST['hsi_webhook_secret'] ?? ''));
            
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        
        $wc_settings = get_option('woocommerce_stripe_settings', []);
        $using_wc_gateway = !empty($wc_settings['publishable_key']) || !empty($wc_settings['test_publishable_key']);
        
        $test_mode = get_option('hsi_test_mode', 'yes');
        $webhook_url = home_url('/wc-api/stripe_webhook');
        
        ?>
        <div class="wrap">
            <h1>Headless Stripe Integration</h1>
            
            <?php if ($using_wc_gateway): ?>
                <div class="notice notice-info">
                    <p><strong>WooCommerce Stripe Gateway Detected!</strong></p>
                    <p>This plugin is using Stripe keys from WooCommerce Stripe Gateway settings.</p>
                    <p><a href="<?php echo admin_url('admin.php?page=wc-settings&tab=checkout&section=stripe'); ?>" class="button">Configure Stripe in WooCommerce</a></p>
                </div>
            <?php else: ?>
                <div class="notice notice-warning">
                    <p><strong>WooCommerce Stripe Gateway not detected.</strong></p>
                    <p>Configure your Stripe API keys below, or install the WooCommerce Stripe Gateway plugin.</p>
                </div>
            <?php endif; ?>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>API Configuration</h2>
                <form method="post">
                    <?php wp_nonce_field('hsi_settings'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th>Test Mode</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="hsi_test_mode" value="yes" <?php checked($test_mode, 'yes'); ?>>
                                    Enable test mode
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th colspan="2"><h3>Test Keys</h3></th>
                        </tr>
                        <tr>
                            <th>Test Publishable Key</th>
                            <td>
                                <input type="text" name="hsi_test_publishable_key" 
                                       value="<?php echo esc_attr(get_option('hsi_test_publishable_key', '')); ?>" 
                                       class="regular-text" placeholder="pk_test_...">
                            </td>
                        </tr>
                        <tr>
                            <th>Test Secret Key</th>
                            <td>
                                <input type="password" name="hsi_test_secret_key" 
                                       value="<?php echo esc_attr(get_option('hsi_test_secret_key', '')); ?>" 
                                       class="regular-text" placeholder="sk_test_...">
                            </td>
                        </tr>
                        <tr>
                            <th colspan="2"><h3>Live Keys</h3></th>
                        </tr>
                        <tr>
                            <th>Live Publishable Key</th>
                            <td>
                                <input type="text" name="hsi_live_publishable_key" 
                                       value="<?php echo esc_attr(get_option('hsi_live_publishable_key', '')); ?>" 
                                       class="regular-text" placeholder="pk_live_...">
                            </td>
                        </tr>
                        <tr>
                            <th>Live Secret Key</th>
                            <td>
                                <input type="password" name="hsi_live_secret_key" 
                                       value="<?php echo esc_attr(get_option('hsi_live_secret_key', '')); ?>" 
                                       class="regular-text" placeholder="sk_live_...">
                            </td>
                        </tr>
                        <tr>
                            <th colspan="2"><h3>Webhook Configuration</h3></th>
                        </tr>
                        <tr>
                            <th>Webhook URL</th>
                            <td>
                                <code><?php echo esc_html($webhook_url); ?></code>
                                <p class="description">Add this URL to your Stripe webhook endpoints</p>
                            </td>
                        </tr>
                        <tr>
                            <th>Webhook Secret</th>
                            <td>
                                <input type="password" name="hsi_webhook_secret" 
                                       value="<?php echo esc_attr(get_option('hsi_webhook_secret', '')); ?>" 
                                       class="regular-text" placeholder="whsec_...">
                                <p class="description">Get this from your Stripe webhook settings</p>
                            </td>
                        </tr>
                    </table>
                    
                    <p>
                        <button type="submit" name="hsi_save_settings" class="button button-primary">Save Settings</button>
                    </p>
                </form>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>REST API Endpoints</h2>
                <ul>
                    <li><code>GET /wp-json/stripe/v1/config</code> - Get Stripe configuration</li>
                    <li><code>POST /wp-json/stripe/v1/create-payment-intent</code> - Create payment intent</li>
                    <li><code>POST /wp-json/stripe/v1/confirm-payment</code> - Confirm payment</li>
                </ul>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>Webhook Events Supported</h2>
                <ul>
                    <li><strong>payment_intent.succeeded</strong> - Updates order to Processing</li>
                    <li><strong>payment_intent.payment_failed</strong> - Updates order to Failed</li>
                    <li><strong>charge.refunded</strong> - Updates order to Refunded</li>
                    <li><strong>charge.dispute.created</strong> - Updates order to On Hold</li>
                    <li><strong>charge.dispute.closed</strong> - Updates order based on dispute outcome</li>
                </ul>
            </div>
        </div>
        <?php
    }
}
