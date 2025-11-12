<?php
/**
 * Webhook Handler
 */

if (!defined('ABSPATH')) {
    exit;
}

class HSI_Webhook_Handler {
    
    private $stripe_api;
    
    public function __construct($stripe_api) {
        $this->stripe_api = $stripe_api;
        add_action('woocommerce_api_stripe_webhook', [$this, 'handle_webhook']);
    }
    
    /**
     * Handle incoming webhook
     */
    public function handle_webhook() {
        $payload = @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        
        $settings = $this->stripe_api->get_stripe_settings();
        $webhook_secret = $settings['webhook_secret'];
        
        if (empty($webhook_secret)) {
            status_header(400);
            echo json_encode(['error' => 'Webhook secret not configured']);
            exit;
        }
        
        try {
            $event = $this->verify_signature($payload, $sig_header, $webhook_secret);
            
            error_log('HSI Webhook: ' . $event['type']);
            
            switch ($event['type']) {
                case 'payment_intent.succeeded':
                    $this->handle_payment_succeeded($event['data']['object']);
                    break;
                    
                case 'payment_intent.payment_failed':
                    $this->handle_payment_failed($event['data']['object']);
                    break;
                    
                case 'charge.refunded':
                    $this->handle_refund($event['data']['object']);
                    break;
                    
                case 'charge.dispute.created':
                    $this->handle_dispute_created($event['data']['object']);
                    break;
                    
                case 'charge.dispute.closed':
                    $this->handle_dispute_closed($event['data']['object']);
                    break;
            }
            
            status_header(200);
            echo json_encode(['received' => true]);
            exit;
            
        } catch (Exception $e) {
            error_log('HSI Webhook Error: ' . $e->getMessage());
            status_header(400);
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }
    }
    
    /**
     * Verify webhook signature
     */
    private function verify_signature($payload, $sig_header, $secret) {
        $timestamp = 0;
        $signatures = [];
        
        foreach (explode(',', $sig_header) as $part) {
            list($key, $value) = explode('=', $part, 2);
            if ($key === 't') {
                $timestamp = $value;
            } elseif ($key === 'v1') {
                $signatures[] = $value;
            }
        }
        
        if (empty($signatures) || $timestamp === 0) {
            throw new Exception('Invalid signature header');
        }
        
        if (abs(time() - $timestamp) > 300) {
            throw new Exception('Webhook timestamp too old');
        }
        
        $signed_payload = $timestamp . '.' . $payload;
        $expected_signature = hash_hmac('sha256', $signed_payload, $secret);
        
        $valid = false;
        foreach ($signatures as $signature) {
            if (hash_equals($expected_signature, $signature)) {
                $valid = true;
                break;
            }
        }
        
        if (!$valid) {
            throw new Exception('Invalid webhook signature');
        }
        
        return json_decode($payload, true);
    }
    
    /**
     * Handle payment succeeded
     */
    private function handle_payment_succeeded($intent) {
        $order_id = $intent['metadata']['order_id'] ?? null;
        if (!$order_id) return;
        
        $order = wc_get_order($order_id);
        if (!$order || !in_array($order->get_status(), ['pending', 'on-hold'])) {
            return;
        }
        
        $charge_id = !empty($intent['charges']['data']) ? $intent['charges']['data'][0]['id'] : null;
        
        $order->payment_complete($intent['id']);
        $order->set_payment_method('stripe');
        $order->update_meta_data('_stripe_intent_id', $intent['id']);
        
        if ($charge_id) {
            $order->update_meta_data('_stripe_charge_id', $charge_id);
            $order->set_transaction_id($charge_id);
        }
        
        $order->add_order_note('Payment completed via Stripe webhook');
        $order->save();
    }
    
    /**
     * Handle payment failed
     */
    private function handle_payment_failed($intent) {
        $order_id = $intent['metadata']['order_id'] ?? null;
        if (!$order_id) return;
        
        $order = wc_get_order($order_id);
        if (!$order) return;
        
        $error = $intent['last_payment_error']['message'] ?? 'Unknown error';
        $order->update_status('failed', 'Stripe payment failed: ' . $error);
    }
    
    /**
     * Handle refund
     */
    private function handle_refund($charge) {
        $payment_intent_id = $charge['payment_intent'] ?? null;
        if (!$payment_intent_id) return;
        
        $orders = wc_get_orders([
            'meta_key' => '_stripe_intent_id',
            'meta_value' => $payment_intent_id,
            'limit' => 1
        ]);
        
        if (empty($orders)) return;
        
        $order = $orders[0];
        
        if ($charge['refunded'] && $charge['amount_refunded'] === $charge['amount']) {
            $order->update_status('refunded', 'Payment fully refunded via Stripe');
        } else {
            $order->add_order_note(sprintf('Partial refund: %s', 
                wc_price($charge['amount_refunded'] / 100)
            ));
        }
    }
    
    /**
     * Handle dispute created
     */
    private function handle_dispute_created($dispute) {
        $charge_id = $dispute['charge'] ?? null;
        if (!$charge_id) return;
        
        $orders = wc_get_orders([
            'meta_key' => '_stripe_charge_id',
            'meta_value' => $charge_id,
            'limit' => 1
        ]);
        
        if (empty($orders)) return;
        
        $order = $orders[0];
        $order->update_status('on-hold', sprintf('Payment disputed: %s', $dispute['reason']));
    }
    
    /**
     * Handle dispute closed
     */
    private function handle_dispute_closed($dispute) {
        $charge_id = $dispute['charge'] ?? null;
        if (!$charge_id) return;
        
        $orders = wc_get_orders([
            'meta_key' => '_stripe_charge_id',
            'meta_value' => $charge_id,
            'limit' => 1
        ]);
        
        if (empty($orders)) return;
        
        $order = $orders[0];
        
        if ($dispute['status'] === 'won') {
            $order->add_order_note('Dispute won! Payment is valid.');
            if ($order->get_status() === 'on-hold') {
                $order->update_status('processing', 'Dispute resolved in merchant favor');
            }
        } else {
            $order->update_status('failed', 'Dispute lost. Payment reversed.');
        }
    }
}
