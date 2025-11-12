<?php
/**
 * Stripe API Handler
 */

if (!defined('ABSPATH')) {
    exit;
}

class HSI_Stripe_API {
    
    private $settings = null;
    
    public function __construct() {
        // Constructor
    }
    
    /**
     * Get Stripe settings
     */
    public function get_stripe_settings() {
        if ($this->settings !== null) {
            return $this->settings;
        }
        
        // Try WooCommerce Stripe Gateway settings first
        $wc_settings = get_option('woocommerce_stripe_settings', []);
        $test_mode = isset($wc_settings['testmode']) && $wc_settings['testmode'] === 'yes';
        
        if (!empty($wc_settings)) {
            if ($test_mode) {
                $pub_key = $wc_settings['test_publishable_key'] ?? '';
                $secret_key = $wc_settings['test_secret_key'] ?? '';
            } else {
                $pub_key = $wc_settings['publishable_key'] ?? '';
                $secret_key = $wc_settings['secret_key'] ?? '';
            }
        } else {
            // Fallback to plugin settings
            $test_mode = get_option('hsi_test_mode', 'yes') === 'yes';
            if ($test_mode) {
                $pub_key = get_option('hsi_test_publishable_key', '');
                $secret_key = get_option('hsi_test_secret_key', '');
            } else {
                $pub_key = get_option('hsi_live_publishable_key', '');
                $secret_key = get_option('hsi_live_secret_key', '');
            }
        }
        
        $this->settings = [
            'test_mode' => $test_mode,
            'publishable_key' => $pub_key,
            'secret_key' => $secret_key,
            'webhook_secret' => get_option('hsi_webhook_secret', ''),
        ];
        
        return $this->settings;
    }
    
    /**
     * Make Stripe API request
     */
    public function stripe_request($endpoint, $method = 'GET', $data = []) {
        $settings = $this->get_stripe_settings();
        $secret_key = $settings['secret_key'];
        
        if (empty($secret_key)) {
            throw new Exception('Stripe secret key not configured');
        }
        
        $url = 'https://api.stripe.com/v1/' . $endpoint;
        
        $args = [
            'method' => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $secret_key,
                'Content-Type' => 'application/x-www-form-urlencoded',
            ],
            'timeout' => 30,
        ];
        
        if (in_array($method, ['POST', 'PUT']) && !empty($data)) {
            $args['body'] = http_build_query($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $code = wp_remote_retrieve_response_code($response);
        $result = json_decode($body, true);
        
        if ($code < 200 || $code >= 300) {
            $error = $result['error']['message'] ?? 'Unknown error';
            throw new Exception('Stripe API error: ' . $error);
        }
        
        return $result;
    }
    
    /**
     * GET /wp-json/stripe/v1/config
     */
    public function get_config($request) {
        try {
            $settings = $this->get_stripe_settings();
            
            if (empty($settings['publishable_key'])) {
                return new WP_Error('stripe_not_configured', 'Stripe keys not configured', ['status' => 500]);
            }
            
            return new WP_REST_Response([
                'success' => true,
                'publishable_key' => $settings['publishable_key'],
                'mode' => $settings['test_mode'] ? 'test' : 'live'
            ], 200);
            
        } catch (Exception $e) {
            return new WP_Error('config_error', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * GET /wp-json/stripe/v1/debug
     * Returns Stripe account and mode to verify key/account alignment
     */
    public function get_debug_info($request) {
        try {
            $settings = $this->get_stripe_settings();
            $account = $this->stripe_request('account');

            return new WP_REST_Response([
                'success' => true,
                'mode' => $settings['test_mode'] ? 'test' : 'live',
                'publishable_key_prefix' => substr($settings['publishable_key'], 0, 10),
                'account_id' => $account['id'] ?? null,
                'account_email' => $account['email'] ?? null,
                'account_country' => $account['country'] ?? null,
            ], 200);
        } catch (Exception $e) {
            return new WP_Error('debug_error', $e->getMessage(), ['status' => 500]);
        }
    }

    /**
     * POST /wp-json/stripe/v1/create-payment-intent
     */
    public function create_payment_intent($request) {
        try {
            $order_id = $request->get_param('order_id');
            $order = wc_get_order($order_id);
            
            if (!$order) {
                return new WP_Error('invalid_order', 'Order not found', ['status' => 404]);
            }
            
            // Check for existing intent
            $existing_intent_id = $order->get_meta('_stripe_intent_id');
            
            if ($existing_intent_id) {
                try {
                    $intent = $this->stripe_request('payment_intents/' . $existing_intent_id);
                    
                    if (in_array($intent['status'], ['requires_payment_method', 'requires_action', 'requires_confirmation'])) {
                        return new WP_REST_Response([
                            'success' => true,
                            'clientSecret' => $intent['client_secret'],
                            'intentId' => $intent['id'],
                            'amount' => $intent['amount'],
                            'currency' => $intent['currency'],
                            'reused' => true
                        ], 200);
                    }
                } catch (Exception $e) {
                    // Create new intent
                }
            }
            
            // Create new payment intent
            $amount = (int)($order->get_total() * 100);
            $currency = strtolower($order->get_currency());
            
            $intent_data = [
                'amount' => $amount,
                'currency' => $currency,
                'payment_method_types[]' => 'card',
                'metadata[order_id]' => $order_id,
                'metadata[order_number]' => $order->get_order_number(),
                'metadata[customer_email]' => $order->get_billing_email(),
                'description' => sprintf('Order #%s', $order->get_order_number()),
            ];
            
            $intent = $this->stripe_request('payment_intents', 'POST', $intent_data);
            
            // Store intent ID
            $order->update_meta_data('_stripe_intent_id', $intent['id']);
            $order->add_order_note(sprintf('Stripe Payment Intent created: %s', $intent['id']));
            $order->save();
            
            return new WP_REST_Response([
                'success' => true,
                'clientSecret' => $intent['client_secret'],
                'intentId' => $intent['id'],
                'amount' => $intent['amount'],
                'currency' => $intent['currency'],
                'reused' => false
            ], 200);
            
        } catch (Exception $e) {
            error_log('HSI Create Payment Intent Error: ' . $e->getMessage());
            return new WP_Error('payment_intent_error', $e->getMessage(), ['status' => 400]);
        }
    }
    
    /**
     * POST /wp-json/stripe/v1/confirm-payment
     */
    public function confirm_payment($request) {
        try {
            $order_id = $request->get_param('order_id');
            $payment_intent_id = $request->get_param('payment_intent_id');
            
            $order = wc_get_order($order_id);
            
            if (!$order) {
                return new WP_Error('invalid_order', 'Order not found', ['status' => 404]);
            }
            
            // Check if already processed
            if (in_array($order->get_status(), ['processing', 'completed'])) {
                return new WP_REST_Response([
                    'success' => true,
                    'order_id' => $order_id,
                    'order_status' => $order->get_status(),
                    'order_number' => $order->get_order_number(),
                    'message' => 'Order already processed'
                ], 200);
            }
            
            // Verify payment with Stripe
            try {
                $intent = $this->stripe_request('payment_intents/' . $payment_intent_id);
                
                if ($intent['status'] !== 'succeeded') {
                    return new WP_Error('payment_not_succeeded', 
                        sprintf('Payment status is %s', $intent['status']), 
                        ['status' => 400]
                    );
                }
                
                // Verify order ID
                $intent_order_id = $intent['metadata']['order_id'] ?? null;
                if ($intent_order_id && $intent_order_id != $order_id) {
                    return new WP_Error('order_mismatch', 'Payment does not match order', ['status' => 400]);
                }
                
                // Process payment
                $this->process_payment($order, $intent);
                
                return new WP_REST_Response([
                    'success' => true,
                    'order_id' => $order_id,
                    'order_status' => $order->get_status(),
                    'order_number' => $order->get_order_number(),
                    'transaction_id' => $payment_intent_id
                ], 200);
                
            } catch (Exception $e) {
                // Do NOT mark orders as paid when Stripe returns "No such payment_intent".
                // Require a verifiable PaymentIntent in Stripe for safety and reconciliation.
                if (strpos($e->getMessage(), 'No such payment_intent') !== false) {
                    return new WP_Error(
                        'payment_intent_not_found',
                        'Stripe payment could not be verified. Please try again or contact support.',
                        ['status' => 400]
                    );
                }

                throw $e;
            }
            
        } catch (Exception $e) {
            error_log('HSI Confirm Payment Error: ' . $e->getMessage());
            return new WP_Error('confirm_payment_error', $e->getMessage(), ['status' => 400]);
        }
    }
    
    /**
     * Process successful payment
     */
    private function process_payment($order, $intent) {
        $payment_intent_id = $intent['id'];
        $charge_id = !empty($intent['charges']['data']) ? $intent['charges']['data'][0]['id'] : null;

        // Safety: Require a charge id to consider payment completed
        if (empty($charge_id)) {
            throw new Exception('Stripe charge not found on PaymentIntent. Payment cannot be verified.');
        }
        
        $order->payment_complete($payment_intent_id);
        $order->set_payment_method('stripe');
        $order->set_payment_method_title('Credit Card (Stripe)');
        $order->update_meta_data('_stripe_intent_id', $payment_intent_id);
        
        $order->update_meta_data('_stripe_charge_id', $charge_id);
        $order->set_transaction_id($charge_id);
        
        $order->add_order_note(sprintf(
            'Stripe payment completed (Intent: %s%s)',
            $payment_intent_id,
            $charge_id ? ', Charge: ' . $charge_id : ''
        ));
        
        $order->save();
        
        do_action('hsi_payment_completed', $order, $intent);
    }
}
