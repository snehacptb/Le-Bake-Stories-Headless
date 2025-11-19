<?php
/**
 * Plugin Name: Headless WordPress Helper
 * Plugin URI: https://your-site.com
 * Description: Complete headless WordPress solution with CORS support, contact form handling, webhooks for cache invalidation, and WooCommerce Store API integration for Next.js frontends.
 * Version: 1.3.0
 * Author: Your Name
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: headless-helper
 *
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 *
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEADLESS_HELPER_VERSION', '1.3.0');
define('HEADLESS_HELPER_PLUGIN_FILE', __FILE__);
define('HEADLESS_HELPER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEADLESS_HELPER_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main Headless Helper Plugin Class
 */
class HeadlessHelperPlugin {
    
    /**
     * Plugin instance
     */
    private static $instance = null;
    
    /**
     * CORS Handler instance
     */
    private $cors_handler;
    
    /**
     * Contact Form Handler instance
     */
    private $contact_form_handler;
    
    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->load_dependencies();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('plugins_loaded', array($this, 'init'));
        add_action('init', array($this, 'load_textdomain'));
        
        // Register activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        // Include CORS handler
        require_once HEADLESS_HELPER_PLUGIN_DIR . 'headless-helper-plugin/headless-cors.php';

        // Include contact form handler
        require_once HEADLESS_HELPER_PLUGIN_DIR . 'headless-helper-plugin/headless-contact-form.php';

        // Include webhook handler
        require_once HEADLESS_HELPER_PLUGIN_DIR . 'headless-helper-plugin/headless-webhooks.php';
    }
    
    /**
     * Initialize the plugin
     */
    public function init() {
        // Initialize CORS handler
        $this->cors_handler = new HeadlessCORSHandler();
        
        // Initialize contact form handler
        $this->contact_form_handler = new HeadlessContactFormHandler();
        
        // Add admin notices
        add_action('admin_notices', array($this, 'admin_notices'));
        
        // Check for WooCommerce
        add_action('plugins_loaded', array($this, 'check_woocommerce'));
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain('headless-helper', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options
        $default_settings = array(
            'allowed_origins' => "https://your-production-domain.com\nhttps://www.your-production-domain.com",
            'disable_store_api_nonce' => false,
            'enable_debug_logging' => false,
            'frontend_url' => 'http://localhost:3000'
        );
        
        add_option('headless_cors_settings', $default_settings);
        add_option('headless_frontend_url', 'http://localhost:3000');
        add_option('headless_contact_debug', false);
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Check for WooCommerce
     */
    public function check_woocommerce() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-warning"><p><strong>Headless Helper:</strong> WooCommerce is not active. Some features may not work properly.</p></div>';
            });
        }
    }
    
    /**
     * Admin notices
     */
    public function admin_notices() {
        // Check if CORS is properly configured
        $settings = get_option('headless_cors_settings', array());
        if (empty($settings['allowed_origins']) || strpos($settings['allowed_origins'], 'your-production-domain.com') !== false) {
            echo '<div class="notice notice-info is-dismissible">
                <p><strong>Headless Helper:</strong> Please configure your allowed origins in the 
                <a href="' . admin_url('options-general.php?page=headless-cors') . '">CORS settings</a> and 
                <a href="' . admin_url('options-general.php?page=headless-contact-form') . '">Contact Form settings</a>.</p>
            </div>';
        }
        
        // Check if an SMTP plugin is active
        $smtp_plugins = array(
            'wp-mail-smtp/wp_mail_smtp.php',
            'easy-wp-smtp/easy-wp-smtp.php',
            'post-smtp/postman-smtp.php',
            'wp-ses/wp-ses.php'
        );
        
        $smtp_active = false;
        foreach ($smtp_plugins as $plugin) {
            if (is_plugin_active($plugin)) {
                $smtp_active = true;
                break;
            }
        }
        
        if (!$smtp_active && !get_option('headless_smtp_notice_dismissed')) {
            echo '<div class="notice notice-warning is-dismissible" data-notice="headless-smtp">
                <p><strong>Headless Helper:</strong> For reliable email delivery, consider installing an SMTP plugin like 
                <a href="' . admin_url('plugin-install.php?s=wp+mail+smtp&tab=search&type=term') . '">WP Mail SMTP</a> or 
                <a href="' . admin_url('plugin-install.php?s=post+smtp&tab=search&type=term') . '">Post SMTP</a>.</p>
            </div>';
        }
    }
    
    /**
     * Get CORS handler
     */
    public function get_cors_handler() {
        return $this->cors_handler;
    }
    
    /**
     * Get contact form handler
     */
    public function get_contact_form_handler() {
        return $this->contact_form_handler;
    }
}

/**
 * Initialize the plugin
 */
function headless_helper_init() {
    return HeadlessHelperPlugin::get_instance();
}

// Start the plugin
headless_helper_init();

/**
 * Helper function to get plugin instance
 */
function headless_helper() {
    return HeadlessHelperPlugin::get_instance();
}

/**
 * Helper function to get CORS handler
 */
function headless_helper_cors() {
    $plugin = headless_helper();
    return $plugin ? $plugin->get_cors_handler() : null;
}

/**
 * Helper function to get contact form handler
 */
function headless_helper_contact_form() {
    $plugin = headless_helper();
    return $plugin ? $plugin->get_contact_form_handler() : null;
}

// Add AJAX handler for dismissing notices
add_action('wp_ajax_dismiss_headless_notice', function() {
    if (isset($_POST['notice']) && $_POST['notice'] === 'headless-smtp') {
        update_option('headless_smtp_notice_dismissed', true);
    }
    wp_die();
});

// Add JavaScript for dismissible notices
add_action('admin_footer', function() {
    ?>
    <script>
    jQuery(document).ready(function($) {
        $(document).on('click', '.notice[data-notice] .notice-dismiss', function() {
            var notice = $(this).parent().data('notice');
            $.post(ajaxurl, {
                action: 'dismiss_headless_notice',
                notice: notice
            });
        });
    });
    </script>
    <?php
});