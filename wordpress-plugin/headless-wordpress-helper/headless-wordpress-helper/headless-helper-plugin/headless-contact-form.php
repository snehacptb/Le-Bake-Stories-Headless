<?php
/**
 * Headless Contact Form Handler
 * 
 * Handles contact form submissions from headless frontend and sends emails via SMTP.
 * This file is included by the main Headless Helper Plugin.
 * 
 * @package HeadlessHelper
 * @version 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class HeadlessContactFormHandler {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }
    
    public function init() {
        // Add any initialization code here
    }
    
    public function register_rest_routes() {
        register_rest_route('contact-form/v1', '/submit', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_contact_form_submission'),
            'permission_callback' => '__return_true', // Allow public access
            'args' => array(
                'firstName' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'lastName' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'email' => array(
                    'required' => true,
                    'type' => 'string',
                    'validate_callback' => array($this, 'validate_email'),
                    'sanitize_callback' => 'sanitize_email',
                ),
                'phone' => array(
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'subject' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'message' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ),
            ),
        ));
    }
    
    public function validate_email($value, $request, $param) {
        return is_email($value);
    }
    
    public function handle_contact_form_submission($request) {
        $params = $request->get_params();
        
        // Extract form data
        $first_name = $params['firstName'];
        $last_name = $params['lastName'];
        $email = $params['email'];
        $phone = isset($params['phone']) ? $params['phone'] : '';
        $subject = $params['subject'];
        $message = $params['message'];
        
        // Get admin email and site info
        $admin_email = get_option('admin_email');
        $site_name = get_bloginfo('name');
        $site_url = get_site_url();
        
        // Log the attempt for debugging
        $this->log_debug("Contact form submission attempt from: {$email}");
        
        // Prepare email subject (decode HTML entities to prevent &amp; in subject)
        $email_subject = sprintf('[%s] New Contact Form Submission: %s', html_entity_decode($site_name, ENT_QUOTES, 'UTF-8'), $subject);
        
        // Create HTML email body
        $email_body_html = $this->create_html_email_body($first_name, $last_name, $email, $phone, $subject, $message, $site_name, $site_url);
        
        // Create plain text email body as fallback
        $email_body_text = $this->create_text_email_body($first_name, $last_name, $email, $phone, $subject, $message, $site_name);
        
        // Set email headers for HTML email
        // Note: We don't set the "From" header here to allow Post SMTP to use its configured sender
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            "Reply-To: {$first_name} {$last_name} <{$email}>",
            "X-Mailer: WordPress/" . get_bloginfo('version'),
        );
        
        // Log email details for debugging
        $this->log_debug("Sending email to: {$admin_email}");
        $this->log_debug("Email subject: {$email_subject}");
        $this->log_debug("Headers: " . print_r($headers, true));
        
        // Send email
        $email_sent = wp_mail($admin_email, $email_subject, $email_body_html, $headers);
        
        // Log the result
        if ($email_sent) {
            $this->log_debug("Email sent successfully");
            // Log the submission
            $this->log_submission($params);
            
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'Your message has been sent successfully! We will get back to you soon.',
            ), 200);
        } else {
            $this->log_debug("Email failed to send");
            
            // Get the last error from wp_mail
            global $phpmailer;
            $error_message = '';
            if (isset($phpmailer) && is_object($phpmailer)) {
                $error_message = $phpmailer->ErrorInfo;
            }
            
            $this->log_debug("PHPMailer error: " . $error_message);
            
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Failed to send your message. Please try again later.',
                'debug' => WP_DEBUG ? $error_message : null,
            ), 500);
        }
    }
    
    /**
     * Create HTML email body
     */
    private function create_html_email_body($first_name, $last_name, $email, $phone, $subject, $message, $site_name, $site_url) {
        $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #0073aa; color: white; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .field { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 4px solid #0073aa; }
        .field-label { font-weight: bold; color: #0073aa; margin-bottom: 5px; }
        .field-value { margin: 0; }
        .message-content { background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background: #0073aa; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Contact Form Submission</h1>
            <p style="margin: 5px 0 0 0;">From: ' . esc_html($site_name) . '</p>
        </div>
        
        <div class="field">
            <div class="field-label">👤 Full Name:</div>
            <div class="field-value">' . esc_html($first_name . ' ' . $last_name) . '</div>
        </div>
        
        <div class="field">
            <div class="field-label">📧 Email Address:</div>
            <div class="field-value"><a href="mailto:' . esc_attr($email) . '">' . esc_html($email) . '</a></div>
        </div>';
        
        if (!empty($phone)) {
            $html .= '
        <div class="field">
            <div class="field-label">📱 Phone Number:</div>
            <div class="field-value"><a href="tel:' . esc_attr($phone) . '">' . esc_html($phone) . '</a></div>
        </div>';
        }
        
        $html .= '
        <div class="field">
            <div class="field-label">📋 Subject:</div>
            <div class="field-value">' . esc_html($subject) . '</div>
        </div>
        
        <div class="field">
            <div class="field-label">💬 Message:</div>
            <div class="message-content">' . esc_html($message) . '</div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:' . esc_attr($email) . '?subject=Re: ' . esc_attr($subject) . '" class="button">Reply to ' . esc_html($first_name) . '</a>
        </div>
        
        <div class="footer">
            <p><strong>📊 Submission Details:</strong></p>
            <p>🕒 Submitted: ' . current_time('F j, Y \a\t g:i A T') . '<br>
            🌐 Website: <a href="' . esc_url($site_url) . '">' . esc_html($site_name) . '</a><br>
            🔍 IP Address: ' . $this->get_client_ip() . '</p>
            
            <p style="margin-top: 20px; font-style: italic;">
                This email was automatically generated from the contact form on your website.
            </p>
        </div>
    </div>
</body>
</html>';
        
        return $html;
    }
    
    /**
     * Create plain text email body
     */
    private function create_text_email_body($first_name, $last_name, $email, $phone, $subject, $message, $site_name) {
        $text = "NEW CONTACT FORM SUBMISSION\n";
        $text .= "================================\n\n";
        $text .= "Name: {$first_name} {$last_name}\n";
        $text .= "Email: {$email}\n";
        if (!empty($phone)) {
            $text .= "Phone: {$phone}\n";
        }
        $text .= "Subject: {$subject}\n\n";
        $text .= "Message:\n";
        $text .= "--------\n";
        $text .= "{$message}\n\n";
        $text .= "================================\n";
        $text .= "Submission Details:\n";
        $text .= "Submitted: " . current_time('F j, Y \a\t g:i A T') . "\n";
        $text .= "Website: {$site_name}\n";
        $text .= "IP Address: " . $this->get_client_ip() . "\n\n";
        $text .= "This email was automatically generated from the contact form on your website.";
        
        return $text;
    }
    
    /**
     * Get client IP address
     */
    private function get_client_ip() {
        $ip_keys = array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR');
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'Unknown';
    }
    
    /**
     * Log form submission
     */
    private function log_submission($params) {
        // Log to WordPress database
        $submission_data = array(
            'name' => $params['firstName'] . ' ' . $params['lastName'],
            'email' => $params['email'],
            'phone' => isset($params['phone']) ? $params['phone'] : '',
            'subject' => $params['subject'],
            'message' => $params['message'],
            'ip_address' => $this->get_client_ip(),
            'submitted_at' => current_time('mysql'),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
        );
        
        // Log to error log for debugging
        error_log('Contact form submission: ' . json_encode($submission_data));
        
        // You can also save to custom database table if needed
        // $this->save_to_database($submission_data);
    }
    
    /**
     * Debug logging
     */
    private function log_debug($message) {
        if (WP_DEBUG || get_option('headless_contact_debug', false)) {
            error_log('Headless Contact Form: ' . $message);
        }
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Contact Form Settings',
            'Contact Form',
            'manage_options',
            'headless-contact-form',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Admin page
     */
    public function admin_page() {
        // Handle test email
        if (isset($_POST['test_email']) && wp_verify_nonce($_POST['_wpnonce'], 'test_email_nonce')) {
            $test_data = array(
                'firstName' => 'Test',
                'lastName' => 'User',
                'email' => 'test@example.com',
                'phone' => '+1234567890',
                'subject' => 'Test Email from Contact Form Plugin',
                'message' => 'This is a test message to verify that your contact form is working properly. If you receive this email, your SMTP configuration is correct!'
            );
            
            $admin_email = get_option('admin_email');
            $site_name = get_bloginfo('name');
            $site_url = get_site_url();
            
            // Create a proper "from" email address to avoid same from/to issue
            $site_domain = parse_url($site_url, PHP_URL_HOST);
            $from_email = "noreply@{$site_domain}";
            
            // If the domain parsing fails, use a generic noreply email
            if (!$site_domain || strpos($site_domain, '.local') !== false) {
                $from_email = "noreply@{$site_name}.com";
                // Clean up the from email to make it valid
                $from_email = strtolower(preg_replace('/[^a-zA-Z0-9@.-]/', '', $from_email));
            }
            
            $email_subject = '[TEST] Contact Form Plugin Test Email';
            $email_body = $this->create_html_email_body(
                $test_data['firstName'],
                $test_data['lastName'],
                $test_data['email'],
                $test_data['phone'],
                $test_data['subject'],
                $test_data['message'],
                $site_name,
                $site_url
            );
            
            // Let Post SMTP handle the "From" header
            $headers = array(
                'Content-Type: text/html; charset=UTF-8',
            );
            
            $test_result = wp_mail($admin_email, $email_subject, $email_body, $headers);
            
            if ($test_result) {
                echo '<div class="notice notice-success"><p><strong> Test email sent successfully!</strong> Check your inbox at ' . esc_html($admin_email) . '</p></div>';
            } else {
                global $phpmailer;
                $error = '';
                if (isset($phpmailer) && is_object($phpmailer)) {
                    $error = $phpmailer->ErrorInfo;
                }
                echo '<div class="notice notice-error"><p><strong>❌ Test email failed!</strong> Error: ' . esc_html($error) . '</p></div>';
            }
        }
        
        // Handle debug toggle
        if (isset($_POST['toggle_debug']) && wp_verify_nonce($_POST['_wpnonce'], 'toggle_debug_nonce')) {
            $current_debug = get_option('headless_contact_debug', false);
            update_option('headless_contact_debug', !$current_debug);
            echo '<div class="notice notice-success"><p>Debug logging ' . (!$current_debug ? 'enabled' : 'disabled') . '</p></div>';
        }
        
        $debug_enabled = get_option('headless_contact_debug', false);
        ?>
        <div class="wrap">
            <h1>📧 Contact Form Settings</h1>
            
            <div class="card">
                <h2>📊 Current Configuration</h2>
                <table class="form-table">
                    <tr>
                        <th>Admin Email:</th>
                        <td><code><?php echo esc_html(get_option('admin_email')); ?></code></td>
                    </tr>
                    <tr>
                        <th>Site Name:</th>
                        <td><code><?php echo esc_html(get_bloginfo('name')); ?></code></td>
                    </tr>
                    <tr>
                        <th>Contact Form Endpoint:</th>
                        <td><code><?php echo esc_url(home_url('/wp-json/contact-form/v1/submit')); ?></code></td>
                    </tr>
                    <tr>
                        <th>Debug Logging:</th>
                        <td>
                            <span class="<?php echo $debug_enabled ? 'dashicons dashicons-yes-alt' : 'dashicons dashicons-dismiss'; ?>"></span>
                            <?php echo $debug_enabled ? 'Enabled' : 'Disabled'; ?>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="card">
                <h2>🧪 Test Email Functionality</h2>
                <p>Send a test email to verify your SMTP configuration:</p>
                <form method="post" action="">
                    <?php wp_nonce_field('test_email_nonce'); ?>
                    <input type="submit" name="test_email" value="Send Test Email" class="button button-primary" />
                </form>
            </div>
            
            <div class="card">
                <h2>🔧 Debug Settings</h2>
                <p>Enable debug logging to troubleshoot email delivery issues:</p>
                <form method="post" action="">
                    <?php wp_nonce_field('toggle_debug_nonce'); ?>
                    <input type="submit" name="toggle_debug" value="<?php echo $debug_enabled ? 'Disable' : 'Enable'; ?> Debug Logging" class="button" />
                </form>
                <?php if ($debug_enabled): ?>
                    <p><em>Debug logs are written to your WordPress debug.log file.</em></p>
                <?php endif; ?>
            </div>
            
            <div class="card">
                <h2>📝 API Documentation</h2>
                <h3>Endpoint:</h3>
                <p><code>POST <?php echo esc_url(home_url('/wp-json/contact-form/v1/submit')); ?></code></p>
                
                <h3>Required Fields:</h3>
                <ul>
                    <li><strong>firstName</strong> (string) - First name</li>
                    <li><strong>lastName</strong> (string) - Last name</li>
                    <li><strong>email</strong> (string) - Valid email address</li>
                    <li><strong>subject</strong> (string) - Message subject</li>
                    <li><strong>message</strong> (string) - Message content</li>
                </ul>
                
                <h3>Optional Fields:</h3>
                <ul>
                    <li><strong>phone</strong> (string) - Phone number</li>
                </ul>
                
                <h3>Example Request:</h3>
                <pre><code>{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Website Inquiry",
  "message": "Hello, I'm interested in your services..."
}</code></pre>
            </div>
            
            <div class="card">
                <h2>⚙️ SMTP Configuration</h2>
                <p>To ensure reliable email delivery, configure SMTP using one of these plugins:</p>
                <ul>
                    <li><strong>WP Mail SMTP</strong> - Most popular SMTP plugin</li>
                    <li><strong>Easy WP SMTP</strong> - Simple configuration</li>
                    <li><strong>Post SMTP</strong> - Advanced features and logging</li>
                    <li><strong>Mailgun</strong> - Transactional email service</li>
                    <li><strong>SendGrid</strong> - Cloud-based email delivery</li>
                </ul>
                
                <h3>🔍 Troubleshooting Tips:</h3>
                <ul>
                    <li>Check your SMTP plugin configuration</li>
                    <li>Verify your email credentials</li>
                    <li>Test with the "Send Test Email" button above</li>
                    <li>Enable debug logging to see detailed error messages</li>
                    <li>Check your hosting provider's email sending limits</li>
                </ul>
            </div>
        </div>
        <?php
    }
}

// Class is now initialized by the main Headless Helper Plugin