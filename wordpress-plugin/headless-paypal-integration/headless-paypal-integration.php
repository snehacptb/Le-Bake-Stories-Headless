<?php
/**
 * Plugin Name: Headless PayPal Integration
 * Plugin URI: https://github.com/yourusername/headless-paypal-integration
 * Description: REST API endpoints for WooCommerce PayPal Payments integration with headless WordPress
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: headless-paypal-integration
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Headless_PayPal_Integration {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        // Check PayPal plugin status
        register_rest_route('paypal/v1', '/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_paypal_status'),
            'permission_callback' => '__return_true',
        ));
        
        // Get PayPal configuration
        register_rest_route('paypal/v1', '/config', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_paypal_config'),
            'permission_callback' => '__return_true',
        ));
        
        // Create PayPal order
        register_rest_route('paypal/v1', '/create-order', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_paypal_order'),
            'permission_callback' => '__return_true',
            'args' => array(
                'order_id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ));
        
        // Capture PayPal payment
        register_rest_route('paypal/v1', '/capture-order', array(
            'methods' => 'POST',
            'callback' => array($this, 'capture_paypal_order'),
            'permission_callback' => '__return_true',
            'args' => array(
                'paypal_order_id' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'woo_order_id' => array(
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ));
        
        // Get PayPal order details
        register_rest_route('paypal/v1', '/order/(?P<id>[a-zA-Z0-9-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_paypal_order'),
            'permission_callback' => '__return_true',
            'args' => array(
                'id' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
        
        // Cancel PayPal order
        register_rest_route('paypal/v1', '/cancel-order', array(
            'methods' => 'POST',
            'callback' => array($this, 'cancel_paypal_order'),
            'permission_callback' => '__return_true',
            'args' => array(
                'paypal_order_id' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
    }
    
    /**
     * Check if PayPal Payments plugin is active and configured
     */
    public function check_paypal_status($request) {
        // Check if WooCommerce PayPal Payments plugin is active
        $is_active = class_exists('WooCommerce\PayPalCommerce\Plugin');
        
        if (!$is_active) {
            return new WP_REST_Response(array(
                'active' => false,
                'message' => 'WooCommerce PayPal Payments plugin is not active',
            ), 200);
        }
        
        // Check if PayPal is enabled as a payment gateway
        $gateways = WC()->payment_gateways->get_available_payment_gateways();
        $paypal_enabled = isset($gateways['ppcp-gateway']) && $gateways['ppcp-gateway']->enabled === 'yes';
        
        return new WP_REST_Response(array(
            'active' => $paypal_enabled,
            'message' => $paypal_enabled ? 'PayPal is active and configured' : 'PayPal gateway is not enabled',
        ), 200);
    }
    
    /**
     * Get PayPal configuration (client ID for SDK)
     */
    public function get_paypal_config($request) {
        try {
            // Check if WooCommerce PayPal Payments plugin is active
            if (!class_exists('WooCommerce\PayPalCommerce\Plugin')) {
                return new WP_Error('paypal_not_active', 'PayPal Payments plugin is not active', array('status' => 404));
            }
            
            $client_id = '';
            $sandbox_mode = false;
            
            // Method 1: Try to get from the onboarding/connection data (most reliable)
            $onboarding_data = get_option('woocommerce-ppcp-data', array());
            if (!empty($onboarding_data)) {
                error_log('PPCP Onboarding Data found: ' . print_r(array_keys($onboarding_data), true));
                
                // Check environment
                if (isset($onboarding_data['env']) && $onboarding_data['env'] === 'sandbox') {
                    $sandbox_mode = true;
                }
                
                // Get credentials based on environment
                if (isset($onboarding_data['credentials'])) {
                    $credentials = $onboarding_data['credentials'];
                    
                    if ($sandbox_mode && isset($credentials['sandbox'])) {
                        $client_id = $credentials['sandbox']['client_id'] ?? '';
                    } elseif (!$sandbox_mode && isset($credentials['production'])) {
                        $client_id = $credentials['production']['client_id'] ?? '';
                    }
                }
            }
            
            // Method 2: Try gateway settings if onboarding data didn't work
            if (empty($client_id)) {
                $settings = get_option('woocommerce_ppcp-gateway_settings', array());
                error_log('Gateway Settings: ' . print_r(array_keys($settings), true));
                
                // Check sandbox mode from settings
                if (isset($settings['sandbox_on']) && $settings['sandbox_on'] === 'yes') {
                    $sandbox_mode = true;
                } elseif (isset($settings['environment']) && $settings['environment'] === 'sandbox') {
                    $sandbox_mode = true;
                }
                
                // Try different possible field names
                if ($sandbox_mode) {
                    $client_id = $settings['sandbox_client_id'] ?? 
                                $settings['client_id_sandbox'] ?? 
                                $settings['test_client_id'] ?? '';
                } else {
                    $client_id = $settings['client_id'] ?? 
                                $settings['live_client_id'] ?? 
                                $settings['production_client_id'] ?? '';
                }
            }
            
            // Method 3: Try to get from transient cache (PayPal plugin caches credentials)
            if (empty($client_id)) {
                $cached_bearer = get_transient('ppcp_cached_bearer_' . ($sandbox_mode ? 'sandbox' : 'production'));
                if ($cached_bearer && isset($cached_bearer['client_id'])) {
                    $client_id = $cached_bearer['client_id'];
                    error_log('Found client ID in transient cache');
                }
            }
            
            // Method 4: Check all PayPal options in database as last resort
            if (empty($client_id)) {
                global $wpdb;
                $paypal_options = $wpdb->get_results(
                    "SELECT option_name, option_value FROM {$wpdb->options} 
                    WHERE (option_name LIKE '%paypal%' OR option_name LIKE '%ppcp%') 
                    AND option_value LIKE '%client%'
                    LIMIT 20",
                    ARRAY_A
                );
                
                foreach ($paypal_options as $option) {
                    error_log('Checking option: ' . $option['option_name']);
                    $value = maybe_unserialize($option['option_value']);
                    
                    if (is_array($value)) {
                        // Recursively search for client_id in nested arrays
                        $found_client_id = $this->find_client_id_recursive($value, $sandbox_mode);
                        if (!empty($found_client_id)) {
                            $client_id = $found_client_id;
                            error_log('Found client ID in option: ' . $option['option_name']);
                            break;
                        }
                    }
                }
            }
            
            if (empty($client_id)) {
                error_log('PayPal Client ID not found. Sandbox mode: ' . ($sandbox_mode ? 'yes' : 'no'));
                
                return new WP_Error(
                    'paypal_not_configured', 
                    'PayPal client ID not found. Please ensure WooCommerce PayPal Payments is properly connected.',
                    array('status' => 500)
                );
            }
            
            error_log('Successfully retrieved PayPal Client ID. Sandbox: ' . ($sandbox_mode ? 'yes' : 'no'));
            
            return new WP_REST_Response(array(
                'client_id' => $client_id,
                'sandbox_mode' => $sandbox_mode,
            ), 200);
        } catch (Exception $e) {
            error_log('PayPal config error: ' . $e->getMessage());
            return new WP_Error('paypal_error', 'Error loading PayPal configuration: ' . $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Recursively search for client_id in nested arrays
     */
    private function find_client_id_recursive($data, $sandbox_mode = false) {
        if (!is_array($data)) {
            return '';
        }
        
        // Direct check for client_id
        if (isset($data['client_id']) && !empty($data['client_id'])) {
            return $data['client_id'];
        }
        
        // Check for sandbox/production specific client_id
        if ($sandbox_mode) {
            if (isset($data['sandbox_client_id']) && !empty($data['sandbox_client_id'])) {
                return $data['sandbox_client_id'];
            }
            if (isset($data['sandbox']['client_id']) && !empty($data['sandbox']['client_id'])) {
                return $data['sandbox']['client_id'];
            }
        } else {
            if (isset($data['production_client_id']) && !empty($data['production_client_id'])) {
                return $data['production_client_id'];
            }
            if (isset($data['production']['client_id']) && !empty($data['production']['client_id'])) {
                return $data['production']['client_id'];
            }
        }
        
        // Recursively search nested arrays
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $result = $this->find_client_id_recursive($value, $sandbox_mode);
                if (!empty($result)) {
                    return $result;
                }
            }
        }
        
        return '';
    }
    
    /**
     * Create PayPal order for WooCommerce order
     */
    public function create_paypal_order($request) {
        try {
            $woo_order_id = $request->get_param('order_id');
            
            if (!$woo_order_id) {
                return new WP_Error('missing_order_id', 'Order ID is required', array('status' => 400));
            }
            
            // Get WooCommerce order
            $order = wc_get_order($woo_order_id);
            if (!$order) {
                return new WP_Error('invalid_order', 'Invalid order ID', array('status' => 404));
            }
            
            // Check if PayPal Payments plugin is active
            if (!class_exists('WooCommerce\PayPalCommerce\Plugin')) {
                return new WP_Error('paypal_not_active', 'PayPal Payments plugin is not active', array('status' => 404));
            }
            
            // Get PayPal order data
            $paypal_order_data = $this->prepare_paypal_order_data($order);
            
            // Create PayPal order via API
            $paypal_order = $this->call_paypal_api('create_order', $paypal_order_data);
            
            if (is_wp_error($paypal_order)) {
                return $paypal_order;
            }
            
            // Store PayPal order ID in WooCommerce order meta
            $order->update_meta_data('_paypal_order_id', $paypal_order['id']);
            $order->save();
            
            return new WP_REST_Response($paypal_order, 200);
            
        } catch (Exception $e) {
            error_log('PayPal create order error: ' . $e->getMessage());
            return new WP_Error('paypal_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Capture PayPal payment
     */
    public function capture_paypal_order($request) {
        try {
            $paypal_order_id = $request->get_param('paypal_order_id');
            $woo_order_id = $request->get_param('woo_order_id');
            
            if (!$paypal_order_id || !$woo_order_id) {
                return new WP_Error('missing_params', 'PayPal order ID and WooCommerce order ID are required', array('status' => 400));
            }
            
            // Get WooCommerce order
            $order = wc_get_order($woo_order_id);
            if (!$order) {
                return new WP_Error('invalid_order', 'Invalid order ID', array('status' => 404));
            }
            
            // Capture payment via PayPal API
            $capture_result = $this->call_paypal_api('capture_order', array('order_id' => $paypal_order_id));
            
            if (is_wp_error($capture_result)) {
                return $capture_result;
            }
            
            // Update WooCommerce order
            if (isset($capture_result['status']) && $capture_result['status'] === 'COMPLETED') {
                // Get transaction ID from capture result
                $transaction_id = '';
                if (isset($capture_result['purchase_units'][0]['payments']['captures'][0]['id'])) {
                    $transaction_id = $capture_result['purchase_units'][0]['payments']['captures'][0]['id'];
                }
                
                // Mark order as paid
                $order->payment_complete($transaction_id);
                $order->add_order_note(sprintf(__('PayPal payment completed. Transaction ID: %s', 'headless-paypal-integration'), $transaction_id));
                $order->update_meta_data('_paypal_transaction_id', $transaction_id);
                $order->save();
            }
            
            return new WP_REST_Response($capture_result, 200);
            
        } catch (Exception $e) {
            error_log('PayPal capture order error: ' . $e->getMessage());
            return new WP_Error('paypal_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Get PayPal order details
     */
    public function get_paypal_order($request) {
        try {
            $paypal_order_id = $request->get_param('id');
            
            if (!$paypal_order_id) {
                return new WP_Error('missing_order_id', 'PayPal order ID is required', array('status' => 400));
            }
            
            $order_details = $this->call_paypal_api('get_order', array('order_id' => $paypal_order_id));
            
            if (is_wp_error($order_details)) {
                return $order_details;
            }
            
            return new WP_REST_Response($order_details, 200);
            
        } catch (Exception $e) {
            error_log('PayPal get order error: ' . $e->getMessage());
            return new WP_Error('paypal_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Cancel PayPal order
     */
    public function cancel_paypal_order($request) {
        try {
            $paypal_order_id = $request->get_param('paypal_order_id');
            
            if (!$paypal_order_id) {
                return new WP_Error('missing_order_id', 'PayPal order ID is required', array('status' => 400));
            }
            
            // Note: PayPal doesn't have a direct cancel endpoint for orders
            // Orders automatically expire after 3 hours if not completed
            
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'Order will expire automatically',
            ), 200);
            
        } catch (Exception $e) {
            error_log('PayPal cancel order error: ' . $e->getMessage());
            return new WP_Error('paypal_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Prepare PayPal order data from WooCommerce order
     */
    private function prepare_paypal_order_data($order) {
        $items = array();
        
        foreach ($order->get_items() as $item) {
            $items[] = array(
                'name' => $item->get_name(),
                'unit_amount' => array(
                    'currency_code' => $order->get_currency(),
                    'value' => number_format($item->get_total() / $item->get_quantity(), 2, '.', ''),
                ),
                'quantity' => $item->get_quantity(),
            );
        }
        
        return array(
            'intent' => 'CAPTURE',
            'purchase_units' => array(
                array(
                    'reference_id' => (string) $order->get_id(),
                    'amount' => array(
                        'currency_code' => $order->get_currency(),
                        'value' => number_format($order->get_total(), 2, '.', ''),
                        'breakdown' => array(
                            'item_total' => array(
                                'currency_code' => $order->get_currency(),
                                'value' => number_format($order->get_subtotal(), 2, '.', ''),
                            ),
                            'shipping' => array(
                                'currency_code' => $order->get_currency(),
                                'value' => number_format($order->get_shipping_total(), 2, '.', ''),
                            ),
                            'tax_total' => array(
                                'currency_code' => $order->get_currency(),
                                'value' => number_format($order->get_total_tax(), 2, '.', ''),
                            ),
                        ),
                    ),
                    'items' => $items,
                ),
            ),
            'application_context' => array(
                'brand_name' => get_bloginfo('name'),
                'return_url' => $order->get_checkout_order_received_url(),
                'cancel_url' => wc_get_checkout_url(),
            ),
        );
    }
    
    /**
     * Call PayPal API using WooCommerce PayPal Payments plugin's internal services
     */
    private function call_paypal_api($action, $data = array()) {
        try {
            // Use the WooCommerce PayPal Payments plugin's container to get services
            if (!function_exists('WooCommerce\PayPalCommerce\WcGateway\Gateway\PayPalGateway')) {
                // Try to get the bearer service from the plugin
                $bearer = $this->get_ppcp_bearer();
                if (is_wp_error($bearer)) {
                    return $bearer;
                }
                
                // Make API call based on action
                switch ($action) {
                    case 'create_order':
                        return $this->paypal_create_order_with_bearer($bearer, $data);
                        
                    case 'capture_order':
                        return $this->paypal_capture_order_with_bearer($bearer, $data['order_id']);
                        
                    case 'get_order':
                        return $this->paypal_get_order_with_bearer($bearer, $data['order_id']);
                        
                    default:
                        return new WP_Error('invalid_action', 'Invalid API action', array('status' => 400));
                }
            }
            
            return new WP_Error('paypal_not_configured', 'PayPal plugin services not available', array('status' => 500));
            
        } catch (Exception $e) {
            error_log('PayPal API call error: ' . $e->getMessage());
            return new WP_Error('paypal_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Get bearer token from WooCommerce PayPal Payments plugin
     */
    private function get_ppcp_bearer() {
        // Try to get credentials from the plugin's storage
        $client_id = '';
        $client_secret = '';
        $sandbox_mode = false;
        
        // Check woocommerce-ppcp-data-common option (used by newer versions)
        $ppcp_data_common = get_option('woocommerce-ppcp-data-common', array());
        if (!empty($ppcp_data_common)) {
            error_log('PPCP Data Common: ' . print_r(array_keys($ppcp_data_common), true));
            
            // Check if sandbox mode
            if (isset($ppcp_data_common['sandbox_on']) && $ppcp_data_common['sandbox_on']) {
                $sandbox_mode = true;
            }
            
            // Get credentials
            if ($sandbox_mode) {
                $client_id = $ppcp_data_common['sandbox_client_id'] ?? '';
                $client_secret = $ppcp_data_common['sandbox_client_secret'] ?? '';
            } else {
                $client_id = $ppcp_data_common['client_id'] ?? '';
                $client_secret = $ppcp_data_common['client_secret'] ?? '';
            }
        }
        
        // Fallback: Try woocommerce-ppcp-data option
        if (empty($client_id) || empty($client_secret)) {
            $onboarding_data = get_option('woocommerce-ppcp-data', array());
            if (!empty($onboarding_data)) {
                if (isset($onboarding_data['env']) && $onboarding_data['env'] === 'sandbox') {
                    $sandbox_mode = true;
                }
                
                if (isset($onboarding_data['credentials'])) {
                    $credentials = $onboarding_data['credentials'];
                    
                    if ($sandbox_mode && isset($credentials['sandbox'])) {
                        $client_id = $credentials['sandbox']['client_id'] ?? '';
                        $client_secret = $credentials['sandbox']['client_secret'] ?? '';
                    } elseif (!$sandbox_mode && isset($credentials['production'])) {
                        $client_id = $credentials['production']['client_id'] ?? '';
                        $client_secret = $credentials['production']['client_secret'] ?? '';
                    }
                }
            }
        }
        
        // Last resort: Search all ppcp options for credentials
        if (empty($client_id) || empty($client_secret)) {
            global $wpdb;
            $ppcp_options = $wpdb->get_results(
                "SELECT option_name, option_value FROM {$wpdb->options} 
                WHERE option_name LIKE '%ppcp%' 
                LIMIT 50",
                ARRAY_A
            );
            
            foreach ($ppcp_options as $option) {
                $value = maybe_unserialize($option['option_value']);
                
                if (is_array($value)) {
                    // Look for client_id and client_secret
                    if (empty($client_id) && isset($value['client_id'])) {
                        $client_id = $value['client_id'];
                        error_log('Found client_id in: ' . $option['option_name']);
                    }
                    if (empty($client_secret) && isset($value['client_secret'])) {
                        $client_secret = $value['client_secret'];
                        error_log('Found client_secret in: ' . $option['option_name']);
                    }
                    
                    // Check nested arrays
                    foreach ($value as $key => $nested) {
                        if (is_array($nested)) {
                            if (empty($client_id) && isset($nested['client_id'])) {
                                $client_id = $nested['client_id'];
                                error_log('Found client_id in: ' . $option['option_name'] . '[' . $key . ']');
                            }
                            if (empty($client_secret) && isset($nested['client_secret'])) {
                                $client_secret = $nested['client_secret'];
                                error_log('Found client_secret in: ' . $option['option_name'] . '[' . $key . ']');
                            }
                        }
                    }
                }
                
                if (!empty($client_id) && !empty($client_secret)) {
                    break;
                }
            }
        }
        
        if (empty($client_id) || empty($client_secret)) {
            error_log('PayPal API call failed: Missing client_id or client_secret');
            error_log('client_id present: ' . (!empty($client_id) ? 'yes' : 'no'));
            error_log('client_secret present: ' . (!empty($client_secret) ? 'yes' : 'no'));
            return new WP_Error('paypal_not_configured', 'PayPal credentials not configured. Please ensure the WooCommerce PayPal Payments plugin is properly connected.', array('status' => 500));
        }
        
        // Get API base URL
        $api_url = $sandbox_mode 
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
        
        // Get access token
        $access_token = $this->get_paypal_access_token($api_url, $client_id, $client_secret);
        if (is_wp_error($access_token)) {
            return $access_token;
        }
        
        return array(
            'token' => $access_token,
            'api_url' => $api_url,
            'sandbox' => $sandbox_mode
        );
    }
    
    /**
     * Get PayPal access token
     */
    private function get_paypal_access_token($api_url, $client_id, $client_secret) {
        $response = wp_remote_post($api_url . '/v1/oauth2/token', array(
            'headers' => array(
                'Authorization' => 'Basic ' . base64_encode($client_id . ':' . $client_secret),
                'Content-Type' => 'application/x-www-form-urlencoded',
            ),
            'body' => 'grant_type=client_credentials',
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (!isset($body['access_token'])) {
            return new WP_Error('auth_failed', 'Failed to get PayPal access token', array('status' => 500));
        }
        
        return $body['access_token'];
    }
    
    /**
     * Create PayPal order with bearer token
     */
    private function paypal_create_order_with_bearer($bearer, $order_data) {
        $response = wp_remote_post($bearer['api_url'] . '/v2/checkout/orders', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $bearer['token'],
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($order_data),
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            error_log('PayPal create order request failed: ' . $response->get_error_message());
            return $response;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($response_code !== 201 && $response_code !== 200) {
            $error_message = isset($body['message']) ? $body['message'] : 'Failed to create PayPal order';
            error_log('PayPal create order failed with status ' . $response_code . ': ' . print_r($body, true));
            return new WP_Error('create_failed', $error_message, array('status' => $response_code));
        }
        
        if (!isset($body['id'])) {
            error_log('PayPal create order response missing ID: ' . print_r($body, true));
            return new WP_Error('create_failed', 'Failed to create PayPal order - no order ID returned', array('status' => 500));
        }
        
        return $body;
    }
    
    /**
     * Capture PayPal order with bearer token
     */
    private function paypal_capture_order_with_bearer($bearer, $order_id) {
        $response = wp_remote_post($bearer['api_url'] . '/v2/checkout/orders/' . $order_id . '/capture', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $bearer['token'],
                'Content-Type' => 'application/json',
            ),
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            error_log('PayPal capture order request failed: ' . $response->get_error_message());
            return $response;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($response_code !== 201 && $response_code !== 200) {
            $error_message = isset($body['message']) ? $body['message'] : 'Failed to capture PayPal payment';
            error_log('PayPal capture failed with status ' . $response_code . ': ' . print_r($body, true));
            return new WP_Error('capture_failed', $error_message, array('status' => $response_code));
        }
        
        return $body;
    }
    
    /**
     * Get PayPal order details with bearer token
     */
    private function paypal_get_order_with_bearer($bearer, $order_id) {
        $response = wp_remote_get($bearer['api_url'] . '/v2/checkout/orders/' . $order_id, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $bearer['token'],
                'Content-Type' => 'application/json',
            ),
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            error_log('PayPal get order request failed: ' . $response->get_error_message());
            return $response;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if ($response_code !== 200) {
            $error_message = isset($body['message']) ? $body['message'] : 'Failed to get PayPal order';
            error_log('PayPal get order failed with status ' . $response_code . ': ' . print_r($body, true));
            return new WP_Error('get_order_failed', $error_message, array('status' => $response_code));
        }
        
        return $body;
    }
    
    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'Headless PayPal Settings',
            'Headless PayPal',
            'manage_woocommerce',
            'headless-paypal-settings',
            array($this, 'render_admin_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('headless_paypal_settings', 'headless_paypal_client_id');
        register_setting('headless_paypal_settings', 'headless_paypal_client_secret');
        register_setting('headless_paypal_settings', 'headless_paypal_sandbox_mode');
        
        add_settings_section(
            'headless_paypal_credentials',
            'PayPal API Credentials',
            array($this, 'render_credentials_section'),
            'headless-paypal-settings'
        );
        
        add_settings_field(
            'headless_paypal_sandbox_mode',
            'Environment',
            array($this, 'render_sandbox_field'),
            'headless-paypal-settings',
            'headless_paypal_credentials'
        );
        
        add_settings_field(
            'headless_paypal_client_id',
            'Client ID',
            array($this, 'render_client_id_field'),
            'headless-paypal-settings',
            'headless_paypal_credentials'
        );
        
        add_settings_field(
            'headless_paypal_client_secret',
            'Client Secret',
            array($this, 'render_client_secret_field'),
            'headless-paypal-settings',
            'headless_paypal_credentials'
        );
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'woocommerce_page_headless-paypal-settings') {
            return;
        }
        
        wp_enqueue_style('headless-paypal-admin', plugin_dir_url(__FILE__) . 'admin-style.css', array(), '1.0.0');
    }
    
    /**
     * Render credentials section description
     */
    public function render_credentials_section() {
        echo '<p>Enter your PayPal REST API credentials. Get them from the <a href="https://developer.paypal.com/dashboard/" target="_blank">PayPal Developer Dashboard</a>.</p>';
    }
    
    /**
     * Render sandbox mode field
     */
    public function render_sandbox_field() {
        $sandbox_mode = get_option('headless_paypal_sandbox_mode', '1');
        ?>
        <select name="headless_paypal_sandbox_mode" id="headless_paypal_sandbox_mode">
            <option value="1" <?php selected($sandbox_mode, '1'); ?>>Sandbox (Testing)</option>
            <option value="0" <?php selected($sandbox_mode, '0'); ?>>Live (Production)</option>
        </select>
        <p class="description">Use Sandbox for testing, Live for production payments.</p>
        <?php
    }
    
    /**
     * Render client ID field
     */
    public function render_client_id_field() {
        $client_id = get_option('headless_paypal_client_id', '');
        ?>
        <input type="text" name="headless_paypal_client_id" id="headless_paypal_client_id" 
               value="<?php echo esc_attr($client_id); ?>" class="regular-text" />
        <p class="description">Your PayPal REST API Client ID</p>
        <?php
    }
    
    /**
     * Render client secret field
     */
    public function render_client_secret_field() {
        $client_secret = get_option('headless_paypal_client_secret', '');
        $masked = !empty($client_secret) ? str_repeat('•', 40) : '';
        ?>
        <input type="password" name="headless_paypal_client_secret" id="headless_paypal_client_secret" 
               value="<?php echo esc_attr($client_secret); ?>" class="regular-text" 
               placeholder="<?php echo esc_attr($masked); ?>" />
        <button type="button" class="button" onclick="togglePasswordVisibility()">Show/Hide</button>
        <p class="description">Your PayPal REST API Client Secret (kept secure)</p>
        <script>
        function togglePasswordVisibility() {
            var input = document.getElementById('headless_paypal_client_secret');
            input.type = input.type === 'password' ? 'text' : 'password';
        }
        </script>
        <?php
    }
    
    /**
     * Render admin page
     */
    public function render_admin_page() {
        // Handle form submission
        if (isset($_POST['headless_paypal_save']) && check_admin_referer('headless_paypal_save_settings')) {
            $client_id = sanitize_text_field($_POST['headless_paypal_client_id']);
            $client_secret = sanitize_text_field($_POST['headless_paypal_client_secret']);
            $sandbox_mode = isset($_POST['headless_paypal_sandbox_mode']) && $_POST['headless_paypal_sandbox_mode'] === '1';
            
            // Update individual options
            update_option('headless_paypal_client_id', $client_id);
            update_option('headless_paypal_client_secret', $client_secret);
            update_option('headless_paypal_sandbox_mode', $sandbox_mode ? '1' : '0');
            
            // Update the combined option that the plugin uses
            update_option('woocommerce-ppcp-data-common', array(
                'client_id' => $client_id,
                'client_secret' => $client_secret,
                'sandbox_on' => $sandbox_mode,
            ));
            
            // Test credentials
            $test_result = $this->test_credentials($client_id, $client_secret, $sandbox_mode);
            
            if ($test_result['success']) {
                echo '<div class="notice notice-success is-dismissible"><p><strong>Success!</strong> Credentials saved and verified.</p></div>';
            } else {
                echo '<div class="notice notice-warning is-dismissible"><p><strong>Warning:</strong> Credentials saved but verification failed: ' . esc_html($test_result['message']) . '</p></div>';
            }
        }
        
        // Handle test connection
        if (isset($_POST['headless_paypal_test']) && check_admin_referer('headless_paypal_test_connection')) {
            $client_id = get_option('headless_paypal_client_id', '');
            $client_secret = get_option('headless_paypal_client_secret', '');
            $sandbox_mode = get_option('headless_paypal_sandbox_mode', '1') === '1';
            
            $test_result = $this->test_credentials($client_id, $client_secret, $sandbox_mode);
            
            if ($test_result['success']) {
                echo '<div class="notice notice-success is-dismissible"><p><strong>✓ Connection Successful!</strong> Your PayPal credentials are working correctly.</p></div>';
            } else {
                echo '<div class="notice notice-error is-dismissible"><p><strong>✗ Connection Failed:</strong> ' . esc_html($test_result['message']) . '</p></div>';
            }
        }
        
        $client_id = get_option('headless_paypal_client_id', '');
        $client_secret = get_option('headless_paypal_client_secret', '');
        $sandbox_mode = get_option('headless_paypal_sandbox_mode', '1');
        $has_credentials = !empty($client_id) && !empty($client_secret);
        ?>
        <div class="wrap">
            <h1>Headless PayPal Integration Settings</h1>
            
            <div class="headless-paypal-admin-container">
                <div class="headless-paypal-main">
                    <div class="card">
                        <h2>PayPal API Credentials</h2>
                        <form method="post" action="">
                            <?php wp_nonce_field('headless_paypal_save_settings'); ?>
                            
                            <table class="form-table">
                                <tr>
                                    <th scope="row"><label for="headless_paypal_sandbox_mode">Environment</label></th>
                                    <td>
                                        <?php $this->render_sandbox_field(); ?>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="headless_paypal_client_id">Client ID</label></th>
                                    <td>
                                        <?php $this->render_client_id_field(); ?>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="headless_paypal_client_secret">Client Secret</label></th>
                                    <td>
                                        <?php $this->render_client_secret_field(); ?>
                                    </td>
                                </tr>
                            </table>
                            
                            <p class="submit">
                                <input type="submit" name="headless_paypal_save" class="button button-primary" value="Save Credentials" />
                            </p>
                        </form>
                    </div>
                    
                    <?php if ($has_credentials): ?>
                    <div class="card">
                        <h2>Test Connection</h2>
                        <p>Test your PayPal API credentials to ensure they're working correctly.</p>
                        <form method="post" action="">
                            <?php wp_nonce_field('headless_paypal_test_connection'); ?>
                            <p>
                                <input type="submit" name="headless_paypal_test" class="button button-secondary" value="Test PayPal Connection" />
                            </p>
                        </form>
                    </div>
                    <?php endif; ?>
                    
                    <div class="card">
                        <h2>API Endpoints</h2>
                        <p>Your headless frontend can use these REST API endpoints:</p>
                        <ul style="list-style: disc; margin-left: 20px;">
                            <li><strong>Config:</strong> <code><?php echo esc_url(rest_url('paypal/v1/config')); ?></code></li>
                            <li><strong>Status:</strong> <code><?php echo esc_url(rest_url('paypal/v1/status')); ?></code></li>
                            <li><strong>Create Order:</strong> <code><?php echo esc_url(rest_url('paypal/v1/create-order')); ?></code></li>
                            <li><strong>Capture Order:</strong> <code><?php echo esc_url(rest_url('paypal/v1/capture-order')); ?></code></li>
                        </ul>
                        <p>
                            <a href="<?php echo esc_url(rest_url('paypal/v1/config')); ?>" target="_blank" class="button">Test Config Endpoint</a>
                            <a href="<?php echo esc_url(rest_url('paypal/v1/status')); ?>" target="_blank" class="button">Test Status Endpoint</a>
                        </p>
                    </div>
                </div>
                
                <div class="headless-paypal-sidebar">
                    <div class="card">
                        <h3>📚 Quick Start Guide</h3>
                        <ol style="margin-left: 20px;">
                            <li>Get credentials from <a href="https://developer.paypal.com/dashboard/" target="_blank">PayPal Developer Dashboard</a></li>
                            <li>Choose Sandbox for testing or Live for production</li>
                            <li>Create an app and copy Client ID & Secret</li>
                            <li>Enter credentials above and save</li>
                            <li>Test the connection</li>
                        </ol>
                    </div>
                    
                    <div class="card">
                        <h3>✅ Status</h3>
                        <?php
                        $status_checks = array(
                            'WooCommerce' => class_exists('WooCommerce'),
                            'PayPal Plugin' => class_exists('WooCommerce\PayPalCommerce\Plugin'),
                            'Credentials Set' => $has_credentials,
                        );
                        
                        foreach ($status_checks as $label => $status) {
                            $icon = $status ? '✓' : '✗';
                            $color = $status ? 'green' : 'red';
                            echo '<p><span style="color: ' . $color . ';">' . $icon . '</span> ' . esc_html($label) . '</p>';
                        }
                        ?>
                    </div>
                    
                    <div class="card">
                        <h3>🔒 Security Notes</h3>
                        <ul style="margin-left: 20px; list-style: disc;">
                            <li>Credentials are stored securely in WordPress database</li>
                            <li>Never share your Client Secret</li>
                            <li>Use Sandbox for testing</li>
                            <li>Restrict API access by IP in PayPal dashboard</li>
                        </ul>
                    </div>
                    
                    <div class="card">
                        <h3>📖 Documentation</h3>
                        <ul style="margin-left: 20px; list-style: disc;">
                            <li><a href="https://developer.paypal.com/docs/api/overview/" target="_blank">PayPal API Docs</a></li>
                            <li><a href="https://developer.paypal.com/dashboard/" target="_blank">Developer Dashboard</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .headless-paypal-admin-container {
                display: flex;
                gap: 20px;
                margin-top: 20px;
            }
            .headless-paypal-main {
                flex: 1;
                max-width: 800px;
            }
            .headless-paypal-sidebar {
                width: 300px;
            }
            .card {
                background: #fff;
                border: 1px solid #ccd0d4;
                box-shadow: 0 1px 1px rgba(0,0,0,.04);
                padding: 20px;
                margin-bottom: 20px;
            }
            .card h2, .card h3 {
                margin-top: 0;
            }
            .card code {
                background: #f0f0f1;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                word-break: break-all;
            }
            @media (max-width: 782px) {
                .headless-paypal-admin-container {
                    flex-direction: column;
                }
                .headless-paypal-sidebar {
                    width: 100%;
                }
            }
        </style>
        <?php
    }
    
    /**
     * Test PayPal credentials
     */
    private function test_credentials($client_id, $client_secret, $sandbox_mode) {
        if (empty($client_id) || empty($client_secret)) {
            return array(
                'success' => false,
                'message' => 'Client ID and Client Secret are required'
            );
        }
        
        $api_url = $sandbox_mode 
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
        
        $response = wp_remote_post($api_url . '/v1/oauth2/token', array(
            'headers' => array(
                'Authorization' => 'Basic ' . base64_encode($client_id . ':' . $client_secret),
                'Content-Type' => 'application/x-www-form-urlencoded',
            ),
            'body' => 'grant_type=client_credentials',
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['access_token'])) {
            return array(
                'success' => true,
                'message' => 'Credentials verified successfully'
            );
        }
        
        $error_msg = isset($body['error_description']) ? $body['error_description'] : 'Invalid credentials';
        return array(
            'success' => false,
            'message' => $error_msg
        );
    }
}

// Initialize the plugin
add_action('plugins_loaded', function() {
    if (class_exists('WooCommerce')) {
        Headless_PayPal_Integration::get_instance();
    }
});
