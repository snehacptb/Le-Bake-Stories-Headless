<?php
/**
 * PayPal Credentials Setup Script
 * 
 * This script helps you manually set PayPal API credentials in WordPress.
 * 
 * USAGE:
 * 1. Edit the credentials below
 * 2. Upload this file to your WordPress root directory
 * 3. Visit: https://your-site.com/set-credentials.php
 * 4. Delete this file after use for security
 */

// Load WordPress
require_once('wp-load.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('Access denied. You must be an administrator.');
}

// Configuration
$sandbox_mode = true; // Set to false for production
$client_id = 'YOUR_CLIENT_ID_HERE'; // Replace with your PayPal Client ID
$client_secret = 'YOUR_CLIENT_SECRET_HERE'; // Replace with your PayPal Client Secret

// Validate credentials
if ($client_id === 'YOUR_CLIENT_ID_HERE' || $client_secret === 'YOUR_CLIENT_SECRET_HERE') {
    die('
    <h1>PayPal Credentials Setup</h1>
    <p style="color: red;"><strong>Error:</strong> Please edit this file and set your PayPal credentials first.</p>
    <h2>Instructions:</h2>
    <ol>
        <li>Get your credentials from <a href="https://developer.paypal.com/dashboard/" target="_blank">PayPal Developer Dashboard</a></li>
        <li>Edit this file (set-credentials.php)</li>
        <li>Replace YOUR_CLIENT_ID_HERE and YOUR_CLIENT_SECRET_HERE with your actual credentials</li>
        <li>Set $sandbox_mode to true for testing or false for production</li>
        <li>Refresh this page</li>
    </ol>
    ');
}

// Set credentials in WordPress options
$credentials = array(
    'client_id' => $client_id,
    'client_secret' => $client_secret,
    'sandbox_on' => $sandbox_mode,
);

// Update the option
$updated = update_option('woocommerce-ppcp-data-common', $credentials);

// Also try to update other possible locations
update_option('woocommerce-ppcp-credentials', $credentials);

// Test the credentials by trying to get an access token
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

$test_result = '';
$test_success = false;

if (is_wp_error($response)) {
    $test_result = '<p style="color: orange;"><strong>Warning:</strong> Could not test credentials: ' . $response->get_error_message() . '</p>';
} else {
    $body = json_decode(wp_remote_retrieve_body($response), true);
    
    if (isset($body['access_token'])) {
        $test_result = '<p style="color: green;"><strong>✓ Success!</strong> Credentials are valid and working.</p>';
        $test_success = true;
    } else {
        $error_msg = isset($body['error_description']) ? $body['error_description'] : 'Unknown error';
        $test_result = '<p style="color: red;"><strong>✗ Error:</strong> Credentials are invalid: ' . htmlspecialchars($error_msg) . '</p>';
    }
}

// Display results
?>
<!DOCTYPE html>
<html>
<head>
    <title>PayPal Credentials Setup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f0f0f1;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1e1e1e;
            border-bottom: 2px solid #0073aa;
            padding-bottom: 10px;
        }
        .info-box {
            background: #f0f6fc;
            border-left: 4px solid #0073aa;
            padding: 15px;
            margin: 20px 0;
        }
        .success-box {
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
        }
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        .error-box {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
        }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
        .credential-info {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .next-steps {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 4px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>PayPal Credentials Setup</h1>
        
        <?php if ($test_success): ?>
            <div class="success-box">
                <h2>✓ Setup Complete!</h2>
                <?php echo $test_result; ?>
            </div>
        <?php else: ?>
            <div class="warning-box">
                <?php echo $test_result; ?>
            </div>
        <?php endif; ?>
        
        <h2>Credentials Stored</h2>
        <div class="credential-info">
            <p><strong>Mode:</strong> <?php echo $sandbox_mode ? 'Sandbox (Testing)' : 'Production (Live)'; ?></p>
            <p><strong>Client ID:</strong> <?php echo substr($client_id, 0, 20) . '...'; ?></p>
            <p><strong>Client Secret:</strong> <?php echo str_repeat('*', 40); ?> (hidden)</p>
            <p><strong>Stored in:</strong> <code>woocommerce-ppcp-data-common</code> option</p>
        </div>
        
        <h2>Test Your Integration</h2>
        <div class="info-box">
            <p><strong>1. Test Config Endpoint:</strong></p>
            <p><a href="<?php echo home_url('/wp-json/paypal/v1/config'); ?>" target="_blank">
                <?php echo home_url('/wp-json/paypal/v1/config'); ?>
            </a></p>
            
            <p style="margin-top: 20px;"><strong>2. Test Status Endpoint:</strong></p>
            <p><a href="<?php echo home_url('/wp-json/paypal/v1/status'); ?>" target="_blank">
                <?php echo home_url('/wp-json/paypal/v1/status'); ?>
            </a></p>
        </div>
        
        <?php if ($test_success): ?>
        <div class="next-steps">
            <h2>Next Steps</h2>
            <ol>
                <li><strong>Delete this file</strong> for security: <code>set-credentials.php</code></li>
                <li>Test your checkout page with PayPal payment</li>
                <li>Check WordPress error logs at <code>/wp-content/debug.log</code></li>
                <li>Monitor the browser console for any errors</li>
            </ol>
        </div>
        <?php else: ?>
        <div class="next-steps">
            <h2>Troubleshooting</h2>
            <ol>
                <li>Verify your credentials at <a href="https://developer.paypal.com/dashboard/" target="_blank">PayPal Developer Dashboard</a></li>
                <li>Make sure you're using the correct mode (Sandbox vs Live)</li>
                <li>Check that your PayPal app has the correct permissions</li>
                <li>Ensure your server can make outbound HTTPS requests</li>
            </ol>
        </div>
        <?php endif; ?>
        
        <div class="info-box" style="margin-top: 30px;">
            <h3>⚠️ Security Warning</h3>
            <p><strong>Important:</strong> Delete this file (<code>set-credentials.php</code>) after use to prevent unauthorized access to your PayPal credentials setup.</p>
        </div>
    </div>
</body>
</html>
<?php
// Log the action
error_log('PayPal credentials updated via set-credentials.php script');
?>
