<?php
/**
 * Headless WordPress CORS Handler
 * 
 * Handles CORS functionality for headless WordPress sites with WooCommerce Store API support.
 * This file is included by the main Headless Helper Plugin.
 * 
 * @package HeadlessHelper
 * @version 1.1.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class HeadlessCORSHandler {
    
    /**
     * Plugin version
     */
    const VERSION = '1.1.0';
    
    /**
     * Default allowed origins
     */
    private $default_origins = array(
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://localhost:3000',
        'https://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'https://localhost:3001',
        'https://127.0.0.1:3001',
    );
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        
        // Register activation hook
        register_activation_hook(__FILE__, array($this, 'activate'));
    }
    
    /**
     * Initialize the plugin
     */
    public function init() {
        // Add CORS headers to all requests
        add_action('init', array($this, 'add_cors_headers'), 1);
        
        // Add CORS headers specifically for REST API requests
        add_action('rest_api_init', array($this, 'setup_rest_cors'));
        
        // WooCommerce Store API specific hooks
        if (class_exists('WooCommerce')) {
            add_action('woocommerce_store_api_checkout_update_order_from_request', array($this, 'add_cors_headers'));
            add_action('woocommerce_store_api_checkout_update_order_meta', array($this, 'add_cors_headers'));
            
            // Disable nonce check for Store API if needed
            add_filter('woocommerce_store_api_disable_nonce_check', array($this, 'maybe_disable_nonce_check'));
        }
    }
    
    /**
     * Add CORS headers
     */
    public function add_cors_headers() {
        // Skip if headers already sent
        if (headers_sent()) {
            return;
        }
        
        // Remove any existing CORS headers to prevent duplicates
        header_remove('Access-Control-Allow-Origin');
        header_remove('Access-Control-Allow-Credentials');
        header_remove('Access-Control-Allow-Methods');
        header_remove('Access-Control-Allow-Headers');
        
        // Get the origin of the request
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        
        // Get allowed origins from settings
        $allowed_origins = $this->get_allowed_origins();
        
        // Check if the origin is allowed
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: " . $origin, true);
        }
        
        // Essential CORS headers
        header("Access-Control-Allow-Credentials: true", true);
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH", true);
        // Include both uppercase and lowercase variations for WooCommerce Store API compatibility
        header("Access-Control-Allow-Headers: Content-Type, Authorization, Cart-Token, X-WC-Store-API-Nonce, x-wc-store-api-nonce, X-Requested-With, X-WP-Nonce, X-Forwarded-For", true);
        header("Access-Control-Expose-Headers: X-WC-Store-API-Nonce, x-wc-store-api-nonce, Cart-Token", true);
        header("Access-Control-Max-Age: 86400", true); // Cache preflight for 24 hours
        
        // Handle preflight OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            status_header(200);
            exit();
        }
    }
    
    /**
     * Setup REST API CORS
     */
    public function setup_rest_cors() {
        // Remove default CORS headers and add our own
        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', array($this, 'rest_cors_handler'));
    }
    
    /**
     * Handle REST API CORS
     */
    public function rest_cors_handler($value) {
        $this->add_cors_headers();
        return $value;
    }
    
    /**
     * Maybe disable nonce check for Store API
     */
    public function maybe_disable_nonce_check($disable) {
        $settings = get_option('headless_cors_settings', array());
        return isset($settings['disable_store_api_nonce']) && $settings['disable_store_api_nonce'] ? true : $disable;
    }
    
    /**
     * Get allowed origins from settings
     */
    private function get_allowed_origins() {
        $settings = get_option('headless_cors_settings', array());
        $custom_origins = isset($settings['allowed_origins']) ? $settings['allowed_origins'] : '';
        
        $origins = $this->default_origins;
        
        if (!empty($custom_origins)) {
            $custom_array = array_map('trim', explode("\n", $custom_origins));
            $custom_array = array_filter($custom_array); // Remove empty lines
            $origins = array_merge($origins, $custom_array);
        }
        
        return array_unique($origins);
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options
        $default_settings = array(
            'allowed_origins' => "https://your-production-domain.com\nhttps://www.your-production-domain.com",
            'disable_store_api_nonce' => false,
            'enable_debug_logging' => false
        );
        
        add_option('headless_cors_settings', $default_settings);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Headless CORS Settings',
            'Headless CORS',
            'manage_options',
            'headless-cors',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Initialize admin settings
     */
    public function admin_init() {
        register_setting('headless_cors_settings', 'headless_cors_settings');
        
        add_settings_section(
            'headless_cors_main',
            'CORS Configuration',
            array($this, 'settings_section_callback'),
            'headless-cors'
        );
        
        add_settings_field(
            'allowed_origins',
            'Allowed Origins',
            array($this, 'allowed_origins_callback'),
            'headless-cors',
            'headless_cors_main'
        );
        
        add_settings_field(
            'disable_store_api_nonce',
            'Disable Store API Nonce Check',
            array($this, 'disable_nonce_callback'),
            'headless-cors',
            'headless_cors_main'
        );
        
        add_settings_field(
            'enable_debug_logging',
            'Enable Debug Logging',
            array($this, 'debug_logging_callback'),
            'headless-cors',
            'headless_cors_main'
        );
    }
    
    /**
     * Settings section callback
     */
    public function settings_section_callback() {
        echo '<p>Configure CORS settings for your headless WordPress site. Default origins (localhost:3000, 127.0.0.1:3000) are automatically included.</p>';
    }
    
    /**
     * Allowed origins callback
     */
    public function allowed_origins_callback() {
        $settings = get_option('headless_cors_settings', array());
        $value = isset($settings['allowed_origins']) ? $settings['allowed_origins'] : '';
        
        echo '<textarea name="headless_cors_settings[allowed_origins]" rows="5" cols="50" class="large-text">' . esc_textarea($value) . '</textarea>';
        echo '<p class="description">Enter additional allowed origins, one per line. Example:<br/>https://your-domain.com<br/>https://www.your-domain.com</p>';
    }
    
    /**
     * Disable nonce callback
     */
    public function disable_nonce_callback() {
        $settings = get_option('headless_cors_settings', array());
        $checked = isset($settings['disable_store_api_nonce']) && $settings['disable_store_api_nonce'];
        
        echo '<input type="checkbox" name="headless_cors_settings[disable_store_api_nonce]" value="1" ' . checked(1, $checked, false) . ' />';
        echo '<p class="description">Disable nonce verification for WooCommerce Store API (may be needed for some headless setups)</p>';
    }
    
    /**
     * Debug logging callback
     */
    public function debug_logging_callback() {
        $settings = get_option('headless_cors_settings', array());
        $checked = isset($settings['enable_debug_logging']) && $settings['enable_debug_logging'];
        
        echo '<input type="checkbox" name="headless_cors_settings[enable_debug_logging]" value="1" ' . checked(1, $checked, false) . ' />';
        echo '<p class="description">Enable debug logging for CORS requests (logs to WordPress debug.log)</p>';
    }
    
    /**
     * Admin page
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Headless CORS Settings</h1>
            
            <div class="notice notice-info">
                <p><strong>Current Status:</strong> CORS is enabled for the following origins:</p>
                <ul>
                    <?php foreach ($this->get_allowed_origins() as $origin): ?>
                        <li><code><?php echo esc_html($origin); ?></code></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('headless_cors_settings');
                do_settings_sections('headless-cors');
                submit_button();
                ?>
            </form>
            
            <div class="card">
                <h2>Testing CORS</h2>
                <p>To test if CORS is working properly:</p>
                <ol>
                    <li>Open your browser's developer tools</li>
                    <li>Go to your Next.js frontend</li>
                    <li>Try adding items to cart or performing cart operations</li>
                    <li>Check the Network tab for any CORS errors</li>
                </ol>
                
                <h3>Common Issues:</h3>
                <ul>
                    <li><strong>Still getting CORS errors?</strong> Make sure your frontend URL is in the allowed origins list above.</li>
                    <li><strong>Cart operations not working?</strong> Try enabling "Disable Store API Nonce Check" option.</li>
                    <li><strong>Need to debug?</strong> Enable debug logging and check your WordPress debug.log file.</li>
                </ul>
            </div>
        </div>
        <?php
    }
}

// Class is now initialized by the main Headless Helper Plugin
