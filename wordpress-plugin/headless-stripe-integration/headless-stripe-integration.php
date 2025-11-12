<?php
/**
 * Plugin Name: Headless Stripe Integration (Enhanced)
 * Description: Enhanced Headless WooCommerce Stripe Integration with Webhook Support & Order Status Management
 * Version: 4.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: TechBrein
 * Text Domain: headless-stripe-integration
 * License: GPL v2 or later
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HSI_VERSION', '4.0.0');
define('HSI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HSI_PLUGIN_URL', plugin_dir_url(__FILE__));

// Load plugin files
require_once HSI_PLUGIN_DIR . 'includes/class-stripe-api.php';
require_once HSI_PLUGIN_DIR . 'includes/class-webhook-handler.php';
require_once HSI_PLUGIN_DIR . 'includes/class-admin-settings.php';

/**
 * Main Headless Stripe Integration Class
 */
class Headless_Stripe_Integration {
    
    private static $instance = null;
    private $stripe_api;
    private $webhook_handler;
    private $admin_settings;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', [$this, 'woocommerce_missing_notice']);
            return;
        }
        
        $this->init();
    }
    
    private function init() {
        $this->stripe_api = new HSI_Stripe_API();
        $this->webhook_handler = new HSI_Webhook_Handler($this->stripe_api);
        $this->admin_settings = new HSI_Admin_Settings();
        
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('rest_api_init', [$this, 'add_cors_headers']);
    }
    
    public function woocommerce_missing_notice() {
        echo '<div class="notice notice-error"><p>Headless Stripe Integration requires WooCommerce to be installed and active.</p></div>';
    }
    
    public function add_cors_headers() {
        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        
        add_filter('rest_pre_serve_request', function($served, $result, $request, $server) {
            $origin = get_http_origin();
            
            if ($origin) {
                header('Access-Control-Allow-Origin: ' . $origin);
                header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Allow-Headers: Content-Type, Authorization, Cart-Token, X-WC-Store-API-Nonce, x-wc-store-api-nonce, X-Requested-With, X-WP-Nonce, X-Forwarded-For');
                header('Access-Control-Max-Age: 86400');
            }
            
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                status_header(200);
                exit;
            }
            
            return $served;
        }, 10, 4);
    }
    
    public function register_rest_routes() {
        register_rest_route('stripe/v1', '/config', [
            'methods' => 'GET',
            'callback' => [$this->stripe_api, 'get_config'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('stripe/v1', '/create-payment-intent', [
            'methods' => 'POST',
            'callback' => [$this->stripe_api, 'create_payment_intent'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('stripe/v1', '/confirm-payment', [
            'methods' => 'POST',
            'callback' => [$this->stripe_api, 'confirm_payment'],
            'permission_callback' => '__return_true',
        ]);

        // Debug endpoint to verify Stripe account and mode
        register_rest_route('stripe/v1', '/debug', [
            'methods' => 'GET',
            'callback' => [$this->stripe_api, 'get_debug_info'],
            'permission_callback' => '__return_true',
        ]);
    }
}

// Initialize
add_action('plugins_loaded', function() {
    Headless_Stripe_Integration::get_instance();
});
