<?php
/**
 * Headless WordPress Helper - Webhook Handler
 *
 * Sends webhooks to Next.js frontend when WordPress content is updated
 * Supports: Posts, Pages, Products, Categories, Menus
 *
 * @package HeadlessHelper
 * @version 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Webhook Handler Class
 */
class HeadlessWebhookHandler {

    /**
     * Webhook endpoint URL
     * @var string
     */
    private $webhook_url;

    /**
     * Webhook secret for signature verification
     * @var string
     */
    private $webhook_secret;

    /**
     * Debug mode
     * @var bool
     */
    private $debug;

    /**
     * Constructor
     */
    public function __construct() {
        $this->init_settings();
        $this->init_hooks();

        // Log that webhook handler is loaded (for debugging)
        error_log('[Headless Webhooks] Handler initialized');
    }

    /**
     * Initialize settings
     */
    private function init_settings() {
        $settings = get_option('headless_webhook_settings', array());

        $this->webhook_url = isset($settings['webhook_url'])
            ? $settings['webhook_url']
            : '';

        $this->webhook_secret = isset($settings['webhook_secret'])
            ? $settings['webhook_secret']
            : '';

        $this->debug = isset($settings['debug'])
            ? (bool) $settings['debug']
            : false;
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Always add settings page so admin can configure webhooks
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));

        // Only register content hooks if webhook URL is configured
        if (empty($this->webhook_url)) {
            return;
        }

        // Post hooks
        add_action('save_post', array($this, 'handle_post_save'), 10, 3);
        add_action('delete_post', array($this, 'handle_post_delete'), 10, 2);

        // WooCommerce Product hooks
        add_action('woocommerce_new_product', array($this, 'handle_product_created'), 10, 1);
        add_action('woocommerce_update_product', array($this, 'handle_product_updated'), 10, 1);
        add_action('woocommerce_delete_product', array($this, 'handle_product_deleted'), 10, 1);

        // WooCommerce Category hooks
        add_action('created_product_cat', array($this, 'handle_category_created'), 10, 1);
        add_action('edited_product_cat', array($this, 'handle_category_updated'), 10, 1);
        add_action('delete_product_cat', array($this, 'handle_category_deleted'), 10, 1);

        // Menu hooks
        add_action('wp_update_nav_menu', array($this, 'handle_menu_updated'), 10, 1);
        add_action('wp_delete_nav_menu', array($this, 'handle_menu_deleted'), 10, 1);
    }

    /**
     * Handle post save (posts and pages)
     */
    public function handle_post_save($post_id, $post, $update) {
        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (wp_is_post_revision($post_id)) {
            return;
        }

        // Skip if post is not published
        if ($post->post_status !== 'publish') {
            return;
        }

        // Determine type
        $type = $post->post_type === 'page' ? 'page' : 'post';

        // Send webhook
        $this->send_webhook(array(
            'action' => $update ? 'updated' : 'created',
            'type' => $type,
            'id' => $post_id,
            'data' => array(
                'title' => $post->post_title,
                'slug' => $post->post_name,
                'status' => $post->post_status
            )
        ));
    }

    /**
     * Handle post delete
     */
    public function handle_post_delete($post_id, $post) {
        // Determine type
        $type = $post->post_type === 'page' ? 'page' : 'post';

        // Send webhook
        $this->send_webhook(array(
            'action' => 'deleted',
            'type' => $type,
            'id' => $post_id,
            'data' => array(
                'title' => $post->post_title,
                'slug' => $post->post_name
            )
        ));
    }

    /**
     * Handle product created
     */
    public function handle_product_created($product_id) {
        $this->send_webhook(array(
            'action' => 'created',
            'type' => 'product',
            'id' => $product_id,
            'data' => $this->get_product_data($product_id)
        ));
    }

    /**
     * Handle product updated
     */
    public function handle_product_updated($product_id) {
        $this->send_webhook(array(
            'action' => 'updated',
            'type' => 'product',
            'id' => $product_id,
            'data' => $this->get_product_data($product_id)
        ));
    }

    /**
     * Handle product deleted
     */
    public function handle_product_deleted($product_id) {
        $this->send_webhook(array(
            'action' => 'deleted',
            'type' => 'product',
            'id' => $product_id,
            'data' => array()
        ));
    }

    /**
     * Handle category created
     */
    public function handle_category_created($term_id) {
        $this->send_webhook(array(
            'action' => 'created',
            'type' => 'category',
            'id' => $term_id,
            'data' => $this->get_category_data($term_id)
        ));
    }

    /**
     * Handle category updated
     */
    public function handle_category_updated($term_id) {
        $this->send_webhook(array(
            'action' => 'updated',
            'type' => 'category',
            'id' => $term_id,
            'data' => $this->get_category_data($term_id)
        ));
    }

    /**
     * Handle category deleted
     */
    public function handle_category_deleted($term_id) {
        $this->send_webhook(array(
            'action' => 'deleted',
            'type' => 'category',
            'id' => $term_id,
            'data' => array()
        ));
    }

    /**
     * Handle menu updated
     */
    public function handle_menu_updated($menu_id) {
        $this->send_webhook(array(
            'action' => 'updated',
            'type' => 'menu',
            'id' => $menu_id,
            'data' => array()
        ));
    }

    /**
     * Handle menu deleted
     */
    public function handle_menu_deleted($menu_id) {
        $this->send_webhook(array(
            'action' => 'deleted',
            'type' => 'menu',
            'id' => $menu_id,
            'data' => array()
        ));
    }

    /**
     * Get product data
     */
    private function get_product_data($product_id) {
        $product = wc_get_product($product_id);

        if (!$product) {
            return array();
        }

        return array(
            'name' => $product->get_name(),
            'slug' => $product->get_slug(),
            'price' => $product->get_price(),
            'status' => $product->get_status()
        );
    }

    /**
     * Get category data
     */
    private function get_category_data($term_id) {
        $term = get_term($term_id, 'product_cat');

        if (is_wp_error($term)) {
            return array();
        }

        return array(
            'name' => $term->name,
            'slug' => $term->slug
        );
    }

    /**
     * Send webhook to Next.js
     */
    private function send_webhook($payload) {
        if (empty($this->webhook_url)) {
            return;
        }

        if ($this->debug) {
            error_log('[Headless Webhooks] Sending: ' . json_encode($payload));
        }

        $body = json_encode($payload);

        $args = array(
            'method' => 'POST',
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'body' => $body,
            'timeout' => 30,
            'blocking' => false // Non-blocking to avoid slowing down WordPress
        );

        // Add signature if secret is configured
        if (!empty($this->webhook_secret)) {
            $signature = hash_hmac('sha256', $body, $this->webhook_secret);
            $args['headers']['X-WP-Signature'] = $signature;
        }

        $response = wp_remote_post($this->webhook_url, $args);

        if ($this->debug && is_wp_error($response)) {
            error_log('[Headless Webhooks] Error: ' . $response->get_error_message());
        }
    }

    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_options_page(
            'Headless Webhooks Settings',
            'Headless Webhooks',
            'manage_options',
            'headless-webhooks',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('headless_webhook_settings', 'headless_webhook_settings', array(
            'sanitize_callback' => array($this, 'sanitize_settings')
        ));
    }

    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = array();

        $sanitized['webhook_url'] = isset($input['webhook_url'])
            ? esc_url_raw($input['webhook_url'])
            : '';

        $sanitized['webhook_secret'] = isset($input['webhook_secret'])
            ? sanitize_text_field($input['webhook_secret'])
            : '';

        $sanitized['debug'] = isset($input['debug'])
            ? (bool) $input['debug']
            : false;

        return $sanitized;
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on our settings page
        if ($hook !== 'settings_page_headless-webhooks') {
            return;
        }

        // Ensure jQuery is loaded
        wp_enqueue_script('jquery');
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        $settings = get_option('headless_webhook_settings', array());
        $webhook_url = isset($settings['webhook_url']) ? $settings['webhook_url'] : '';
        $webhook_secret = isset($settings['webhook_secret']) ? $settings['webhook_secret'] : '';
        $debug = isset($settings['debug']) ? $settings['debug'] : false;

        // Create nonce for AJAX request
        $test_nonce = wp_create_nonce('test_headless_webhook');

        ?>
        <div class="wrap">
            <h1>Headless Webhooks Settings</h1>
            <p>Configure webhooks to automatically notify your Next.js frontend when WordPress content is updated.</p>

            <form method="post" action="options.php">
                <?php settings_fields('headless_webhook_settings'); ?>

                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="webhook_url">Webhook URL</label>
                        </th>
                        <td>
                            <input
                                type="url"
                                id="webhook_url"
                                name="headless_webhook_settings[webhook_url]"
                                value="<?php echo esc_attr($webhook_url); ?>"
                                class="regular-text"
                                placeholder="https://your-nextjs-site.com/api/webhooks/wordpress"
                            />
                            <p class="description">
                                Enter your Next.js webhook endpoint URL (e.g., https://your-site.com/api/webhooks/wordpress)
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="webhook_secret">Webhook Secret</label>
                        </th>
                        <td>
                            <input
                                type="password"
                                id="webhook_secret"
                                name="headless_webhook_settings[webhook_secret]"
                                value="<?php echo esc_attr($webhook_secret); ?>"
                                class="regular-text"
                                autocomplete="off"
                            />
                            <p class="description">
                                Optional: Secret key for webhook signature verification (recommended for production)
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="debug">Debug Mode</label>
                        </th>
                        <td>
                            <label>
                                <input
                                    type="checkbox"
                                    id="debug"
                                    name="headless_webhook_settings[debug]"
                                    value="1"
                                    <?php checked($debug, true); ?>
                                />
                                Enable debug logging (logs will appear in debug.log)
                            </label>
                        </td>
                    </tr>
                </table>

                <?php submit_button('Save Settings'); ?>
            </form>

            <hr>

            <h2>Test Webhook</h2>
            <p>Click the button below to send a test webhook to your endpoint.</p>
            <button type="button" id="test-webhook" class="button">Send Test Webhook</button>
            <div id="test-result" style="margin-top: 10px;"></div>

            <script>
            jQuery(document).ready(function($) {
                $('#test-webhook').on('click', function() {
                    var $button = $(this);
                    var $result = $('#test-result');

                    $button.prop('disabled', true).text('Sending...');
                    $result.html('');

                    $.ajax({
                        url: ajaxurl,
                        method: 'POST',
                        data: {
                            action: 'test_headless_webhook',
                            nonce: '<?php echo esc_js($test_nonce); ?>'
                        },
                        success: function(response) {
                            if (response && response.success) {
                                $result.html('<div class="notice notice-success inline"><p>' + (response.data && response.data.message ? response.data.message : 'Test webhook sent successfully!') + '</p></div>');
                            } else {
                                var errorMsg = (response && response.data && response.data.message) ? response.data.message : 'Unknown error occurred';
                                $result.html('<div class="notice notice-error inline"><p>' + errorMsg + '</p></div>');
                            }
                        },
                        error: function(xhr, status, error) {
                            var errorMsg = 'Failed to send test webhook';
                            if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                                errorMsg = xhr.responseJSON.data.message;
                            } else if (xhr.status === 0) {
                                errorMsg = 'Connection failed. Please check your webhook URL and try again.';
                            } else if (xhr.status === 403) {
                                errorMsg = 'Permission denied. Please refresh the page and try again.';
                            } else if (error) {
                                errorMsg = 'Error: ' + error;
                            }
                            $result.html('<div class="notice notice-error inline"><p>' + errorMsg + '</p></div>');
                        },
                        complete: function() {
                            $button.prop('disabled', false).text('Send Test Webhook');
                        }
                    });
                });
            });
            </script>

            <hr>

            <h2>Supported Events</h2>
            <ul>
                <li><strong>Posts & Pages:</strong> Created, Updated, Deleted</li>
                <li><strong>Products (WooCommerce):</strong> Created, Updated, Deleted</li>
                <li><strong>Categories (WooCommerce):</strong> Created, Updated, Deleted</li>
                <li><strong>Menus:</strong> Updated, Deleted</li>
            </ul>
        </div>
        <?php
    }
}

// Initialize the webhook handler
new HeadlessWebhookHandler();

// AJAX handler for test webhook
add_action('wp_ajax_test_headless_webhook', function() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array(
            'message' => 'You do not have permission to perform this action.'
        ));
    }

    // Verify nonce
    $nonce = isset($_POST['nonce']) ? sanitize_text_field($_POST['nonce']) : '';
    if (!wp_verify_nonce($nonce, 'test_headless_webhook')) {
        wp_send_json_error(array(
            'message' => 'Security check failed. Please refresh the page and try again.'
        ));
    }

    $settings = get_option('headless_webhook_settings', array());
    $webhook_url = isset($settings['webhook_url']) ? $settings['webhook_url'] : '';

    if (empty($webhook_url)) {
        wp_send_json_error(array(
            'message' => 'Please configure the webhook URL first.'
        ));
    }

    $webhook_secret = isset($settings['webhook_secret']) ? $settings['webhook_secret'] : '';

    $payload = array(
        'action' => 'test',
        'type' => 'test',
        'id' => 0,
        'data' => array(
            'message' => 'This is a test webhook from WordPress',
            'timestamp' => current_time('mysql')
        )
    );

    $body = json_encode($payload);

    $args = array(
        'method' => 'POST',
        'headers' => array(
            'Content-Type' => 'application/json'
        ),
        'body' => $body,
        'timeout' => 30
    );

    // Add signature if secret is configured
    if (!empty($webhook_secret)) {
        $signature = hash_hmac('sha256', $body, $webhook_secret);
        $args['headers']['X-WP-Signature'] = $signature;
    }

    $response = wp_remote_post($webhook_url, $args);

    if (is_wp_error($response)) {
        $error_message = $response->get_error_message();
        error_log('[Headless Webhooks] Test webhook error: ' . $error_message);
        wp_send_json_error(array(
            'message' => 'Webhook failed: ' . $error_message
        ));
    }

    $response_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);

    // Log response for debugging
    if (isset($settings['debug']) && $settings['debug']) {
        error_log('[Headless Webhooks] Test webhook response code: ' . $response_code);
        error_log('[Headless Webhooks] Test webhook response body: ' . $response_body);
    }

    if ($response_code >= 200 && $response_code < 300) {
        wp_send_json_success(array(
            'message' => 'Test webhook sent successfully! (Status: ' . $response_code . ') Check your Next.js logs.'
        ));
    } else {
        $error_msg = 'Webhook returned status code: ' . $response_code;
        if (!empty($response_body)) {
            $error_msg .= '. Response: ' . substr(strip_tags($response_body), 0, 100);
        }
        wp_send_json_error(array(
            'message' => $error_msg
        ));
    }
});
