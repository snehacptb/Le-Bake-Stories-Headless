<?php
/**
 * Plugin Name: Headless Image Optimizer
 * Description: Automatically optimize and upload images to AWS S3 with CloudFront CDN integration
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: TechBrein
 * Text Domain: headless-image-optimizer
 * License: GPL v2 or later
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HIO_VERSION', '1.0.0');
define('HIO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HIO_PLUGIN_URL', plugin_dir_url(__FILE__));

// Load plugin files
require_once HIO_PLUGIN_DIR . 'includes/class-s3-uploader.php';
require_once HIO_PLUGIN_DIR . 'includes/class-image-optimizer.php';
require_once HIO_PLUGIN_DIR . 'includes/class-cdn-manager.php';
require_once HIO_PLUGIN_DIR . 'includes/class-admin-settings.php';

/**
 * Main Headless Image Optimizer Class
 */
class Headless_Image_Optimizer {
    
    private static $instance = null;
    private $s3_uploader;
    private $image_optimizer;
    private $cdn_manager;
    private $admin_settings;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init();
    }
    
    private function init() {
        $this->s3_uploader = new HIO_S3_Uploader();
        $this->image_optimizer = new HIO_Image_Optimizer();
        $this->cdn_manager = new HIO_CDN_Manager();
        $this->admin_settings = new HIO_Admin_Settings();
        
        // Check for GD library
        add_action('admin_notices', [$this, 'check_gd_library']);
        
        // Hook into WordPress upload process
        add_filter('wp_handle_upload', [$this, 'handle_upload'], 10, 2);
        add_filter('wp_generate_attachment_metadata', [$this, 'handle_attachment_metadata'], 10, 2);
        add_filter('wp_get_attachment_url', [$this, 'replace_with_cdn_url'], 10, 2);
        add_filter('wp_get_attachment_image_src', [$this, 'replace_image_src_with_cdn'], 10, 4);
        
        // REST API endpoints
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('rest_api_init', [$this, 'setup_rest_cors']);
        
        // Add CORS headers to all requests
        add_action('init', [$this, 'add_cors_headers'], 1);
        
        // Admin hooks
        add_action('delete_attachment', [$this, 'delete_from_s3']);
    }
    
    public function check_gd_library() {
        if (!extension_loaded('gd') || !function_exists('gd_info')) {
            ?>
            <div class="notice notice-error">
                <p>
                    <strong>Headless Image Optimizer:</strong> PHP GD library is not installed or enabled. 
                    Image optimization will be skipped. Images will still be uploaded to S3, but without compression.
                    <br>
                    <strong>To fix:</strong> Install PHP GD extension. See the 
                    <a href="<?php echo admin_url('options-general.php?page=headless-image-optimizer'); ?>">plugin settings</a> 
                    for installation instructions.
                </p>
            </div>
            <?php
        }
    }
    
    /**
     * Add CORS headers - integrates with Headless WordPress Helper plugin
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
        
        // Get allowed origins from Headless Helper plugin settings
        $allowed_origins = $this->get_allowed_origins();
        
        // Check if the origin is allowed
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: " . $origin, true);
        }
        
        // Essential CORS headers
        header("Access-Control-Allow-Credentials: true", true);
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH", true);
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce, X-Requested-With, Cart-Token, X-WC-Store-API-Nonce, x-wc-store-api-nonce", true);
        header("Access-Control-Expose-Headers: X-WP-Nonce, X-WC-Store-API-Nonce, x-wc-store-api-nonce", true);
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
     * Get allowed origins from Headless Helper plugin settings or use defaults
     */
    private function get_allowed_origins() {
        // Default localhost origins
        $default_origins = array(
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'https://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'https://localhost:3001',
            'https://127.0.0.1:3001',
        );
        
        // Try to get settings from Headless Helper plugin
        $settings = get_option('headless_cors_settings', array());
        $custom_origins = isset($settings['allowed_origins']) ? $settings['allowed_origins'] : '';
        
        $origins = $default_origins;
        
        if (!empty($custom_origins)) {
            $custom_array = array_map('trim', explode("\n", $custom_origins));
            $custom_array = array_filter($custom_array); // Remove empty lines
            $origins = array_merge($origins, $custom_array);
        }
        
        return array_unique($origins);
    }
    
    public function handle_upload($upload, $context) {
        if (!$this->should_process_upload($upload)) {
            return $upload;
        }
        
        // Optimize the image (optional, can be disabled)
        if (get_option('hio_auto_optimize', '1') === '1') {
            $this->image_optimizer->optimize($upload['file']);
        }
        
        return $upload;
    }
    
    public function handle_attachment_metadata($metadata, $attachment_id) {
        $file = get_attached_file($attachment_id);
        
        if (!$this->is_image($file)) {
            return $metadata;
        }
        
        // Upload to S3 and get CDN URL
        $s3_url = $this->s3_uploader->upload($file, $attachment_id);
        
        if ($s3_url) {
            $cdn_url = $this->cdn_manager->get_cdn_url($s3_url);
            update_post_meta($attachment_id, '_s3_url', $s3_url);
            update_post_meta($attachment_id, '_cdn_url', $cdn_url);
        }
        
        return $metadata;
    }
    
    public function replace_with_cdn_url($url, $attachment_id) {
        $cdn_url = get_post_meta($attachment_id, '_cdn_url', true);
        
        if ($cdn_url) {
            return $cdn_url;
        }
        
        return $url;
    }
    
    public function replace_image_src_with_cdn($image, $attachment_id, $size, $icon) {
        if (!$image) {
            return $image;
        }
        
        $cdn_url = get_post_meta($attachment_id, '_cdn_url', true);
        if ($cdn_url) {
            $image[0] = $cdn_url;
        }
        
        return $image;
    }
    
    public function delete_from_s3($attachment_id) {
        $this->s3_uploader->delete($attachment_id);
    }
    
    private function should_process_upload($upload) {
        if (!isset($upload['file']) || !file_exists($upload['file'])) {
            return false;
        }
        
        return $this->is_image($upload['file']);
    }
    
    private function is_image($file) {
        $mime_type = mime_content_type($file);
        return strpos($mime_type, 'image/') === 0;
    }
    
    public function register_rest_routes() {
        // Get optimized image URL
        register_rest_route('image-optimizer/v1', '/get-url/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_optimized_url'],
            'permission_callback' => '__return_true',
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ]
            ]
        ]);
        
        // Batch optimize existing images
        register_rest_route('image-optimizer/v1', '/batch-optimize', [
            'methods' => 'POST',
            'callback' => [$this, 'batch_optimize'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
        
        // Get plugin stats
        register_rest_route('image-optimizer/v1', '/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'get_stats'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
    }
    
    public function get_optimized_url($request) {
        $attachment_id = $request->get_param('id');
        $cdn_url = get_post_meta($attachment_id, '_cdn_url', true);
        
        if (!$cdn_url) {
            return new WP_Error('no_cdn_url', 'CDN URL not found for this attachment', ['status' => 404]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'attachment_id' => $attachment_id,
            'cdn_url' => $cdn_url
        ]);
    }
    
    public function batch_optimize($request) {
        $params = $request->get_json_params();
        $limit = isset($params['limit']) ? intval($params['limit']) : 10;
        $offset = isset($params['offset']) ? intval($params['offset']) : 0;
        
        $args = [
            'post_type' => 'attachment',
            'post_mime_type' => 'image',
            'posts_per_page' => $limit,
            'offset' => $offset,
            'post_status' => 'inherit',
            'meta_query' => [
                [
                    'key' => '_cdn_url',
                    'compare' => 'NOT EXISTS'
                ]
            ]
        ];
        
        $attachments = get_posts($args);
        $processed = 0;
        
        foreach ($attachments as $attachment) {
            $file = get_attached_file($attachment->ID);
            
            if ($file && file_exists($file)) {
                // Optimize
                $optimized_file = $this->image_optimizer->optimize($file);
                
                // Upload to S3
                $s3_url = $this->s3_uploader->upload($optimized_file ?: $file, $attachment->ID);
                
                if ($s3_url) {
                    update_post_meta($attachment->ID, '_s3_url', $s3_url);
                    update_post_meta($attachment->ID, '_cdn_url', $this->cdn_manager->get_cdn_url($s3_url));
                    $processed++;
                }
            }
        }
        
        return rest_ensure_response([
            'success' => true,
            'processed' => $processed,
            'total_found' => count($attachments),
            'offset' => $offset + $limit
        ]);
    }
    
    public function get_stats($request) {
        global $wpdb;
        
        $total_images = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%'");
        $optimized_images = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_cdn_url'");
        
        return rest_ensure_response([
            'success' => true,
            'total_images' => intval($total_images),
            'optimized_images' => intval($optimized_images),
            'pending_images' => intval($total_images) - intval($optimized_images),
            'cdn_domain' => get_option('hio_cdn_domain', ''),
            's3_bucket' => get_option('hio_s3_bucket', '')
        ]);
    }
}

// Initialize
add_action('plugins_loaded', function() {
    Headless_Image_Optimizer::get_instance();
});

// Activation hook
register_activation_hook(__FILE__, function() {
    // Set default options
    add_option('hio_s3_bucket', 'headlessproject');
    add_option('hio_s3_region', 'ap-south-1');
    add_option('hio_s3_path', 'test/');
    add_option('hio_cdn_domain', 'dejc10dlc5sdq.cloudfront.net');
    add_option('hio_auto_optimize', '1');
    add_option('hio_image_quality', '85');
    add_option('hio_max_width', '2048');
    add_option('hio_max_height', '2048');
    add_option('hio_use_cdn', '1');
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    // Cleanup if needed
});
