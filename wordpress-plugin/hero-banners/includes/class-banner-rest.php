<?php
/**
 * Banner REST API
 *
 * @package Hero_Banners
 */

if (!defined('ABSPATH')) {
    exit;
}

class Banner_REST {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_fields'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_filter('rest_pre_serve_request', array($this, 'add_cors_headers'), 10, 4);
    }
    
    /**
     * Register custom REST fields
     */
    public function register_rest_fields() {
        register_rest_field('banner', 'banner_data', array(
            'get_callback' => array($this, 'get_banner_data'),
            'schema' => array(
                'description' => __('Banner custom fields', 'hero-banners'),
                'type' => 'object',
            ),
        ));
    }
    
    /**
     * Get banner data callback
     */
    public function get_banner_data($post) {
        $image_id = get_post_thumbnail_id($post['id']);
        $pages = get_post_meta($post['id'], '_banner_pages', true);
        $pages = $pages ? $pages : array();
        
        return array(
            'subtitle' => get_post_meta($post['id'], '_banner_subtitle', true),
            'title' => get_post_meta($post['id'], '_banner_title', true),
            'button1' => array(
                'text' => get_post_meta($post['id'], '_banner_button1_text', true),
                'link' => get_post_meta($post['id'], '_banner_button1_link', true),
            ),
            'button2' => array(
                'text' => get_post_meta($post['id'], '_banner_button2_text', true),
                'link' => get_post_meta($post['id'], '_banner_button2_link', true),
            ),
            'image' => array(
                'full' => wp_get_attachment_image_url($image_id, 'full'),
                'large' => wp_get_attachment_image_url($image_id, 'large'),
                'medium' => wp_get_attachment_image_url($image_id, 'medium'),
                'thumbnail' => wp_get_attachment_image_url($image_id, 'thumbnail'),
                'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
            ),
            'order' => (int) get_post_meta($post['id'], '_banner_order', true) ?: 1,
            'status' => get_post_meta($post['id'], '_banner_status', true) ?: 'active',
            'pages' => $pages,
        );
    }
    
    /**
     * Register custom REST routes
     */
    public function register_rest_routes() {
        // Get active banners
        register_rest_route('hero-banners/v1', '/active', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_active_banners'),
            'permission_callback' => '__return_true',
        ));
        
        // Get all banners (admin)
        register_rest_route('hero-banners/v1', '/all', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_all_banners'),
            'permission_callback' => '__return_true',
        ));
        
        // Get banners by page
        register_rest_route('hero-banners/v1', '/page/(?P<page_identifier>[a-zA-Z0-9-_]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_banners_by_page'),
            'permission_callback' => '__return_true',
            'args' => array(
                'page_identifier' => array(
                    'required' => true,
                    'type' => 'string',
                    'description' => __('Page ID, slug, or "home" for home page', 'hero-banners'),
                ),
            ),
        ));
    }
    
    /**
     * Get active banners endpoint
     */
    public function get_active_banners($request) {
        $args = array(
            'post_type' => 'banner',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_key' => '_banner_order',
            'orderby' => 'meta_value_num',
            'order' => 'ASC',
            'meta_query' => array(
                array(
                    'key' => '_banner_status',
                    'value' => 'active',
                    'compare' => '=',
                ),
            ),
        );

        return $this->format_banners_response($args);
    }
    
    /**
     * Get all banners endpoint
     */
    public function get_all_banners($request) {
        $args = array(
            'post_type' => 'banner',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_key' => '_banner_order',
            'orderby' => 'meta_value_num',
            'order' => 'ASC',
        );

        return $this->format_banners_response($args);
    }
    
    /**
     * Get banners by page endpoint
     */
    public function get_banners_by_page($request) {
        $page_identifier = $request->get_param('page_identifier');
        
        // Get all active banners
        $args = array(
            'post_type' => 'banner',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_key' => '_banner_order',
            'orderby' => 'meta_value_num',
            'order' => 'ASC',
            'meta_query' => array(
                array(
                    'key' => '_banner_status',
                    'value' => 'active',
                    'compare' => '=',
                ),
            ),
        );
        
        $banners = get_posts($args);
        $result = array();
        
        // Determine page ID
        $page_id = null;
        if ($page_identifier === 'home') {
            $page_id = 'home';
        } elseif (is_numeric($page_identifier)) {
            $page_id = (string)$page_identifier;
        } else {
            // Try to get page by slug
            $page = get_page_by_path($page_identifier);
            if ($page) {
                $page_id = (string)$page->ID;
            }
        }
        
        // Filter banners for this page
        foreach ($banners as $banner) {
            $banner_pages = get_post_meta($banner->ID, '_banner_pages', true);
            $banner_pages = $banner_pages ? $banner_pages : array();
            
            // Check if banner should be displayed on this page
            $should_display = false;
            
            // If no pages selected, don't display
            if (empty($banner_pages)) {
                continue;
            }
            
            // If 'all' is selected
            if (in_array('all', $banner_pages)) {
                $should_display = true;
            }
            
            // If specific page matches
            if ($page_id && in_array($page_id, $banner_pages)) {
                $should_display = true;
            }
            
            if (!$should_display) {
                continue;
            }
            
            // Add banner to result
            $image_id = get_post_thumbnail_id($banner->ID);
            
            $result[] = array(
                'id' => $banner->ID,
                'subtitle' => get_post_meta($banner->ID, '_banner_subtitle', true),
                'title' => get_post_meta($banner->ID, '_banner_title', true),
                'button1' => array(
                    'text' => get_post_meta($banner->ID, '_banner_button1_text', true),
                    'link' => get_post_meta($banner->ID, '_banner_button1_link', true),
                ),
                'button2' => array(
                    'text' => get_post_meta($banner->ID, '_banner_button2_text', true),
                    'link' => get_post_meta($banner->ID, '_banner_button2_link', true),
                ),
                'image' => array(
                    'full' => wp_get_attachment_image_url($image_id, 'full'),
                    'large' => wp_get_attachment_image_url($image_id, 'large'),
                    'medium' => wp_get_attachment_image_url($image_id, 'medium'),
                    'thumbnail' => wp_get_attachment_image_url($image_id, 'thumbnail'),
                    'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
                ),
                'order' => (int) get_post_meta($banner->ID, '_banner_order', true) ?: 1,
                'status' => get_post_meta($banner->ID, '_banner_status', true) ?: 'active',
                'pages' => $banner_pages,
            );
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Format banners response
     */
    private function format_banners_response($args) {
        $banners = get_posts($args);
        $result = array();

        foreach ($banners as $banner) {
            $image_id = get_post_thumbnail_id($banner->ID);
            $pages = get_post_meta($banner->ID, '_banner_pages', true);
            $pages = $pages ? $pages : array();
            
            $result[] = array(
                'id' => $banner->ID,
                'subtitle' => get_post_meta($banner->ID, '_banner_subtitle', true),
                'title' => get_post_meta($banner->ID, '_banner_title', true),
                'button1' => array(
                    'text' => get_post_meta($banner->ID, '_banner_button1_text', true),
                    'link' => get_post_meta($banner->ID, '_banner_button1_link', true),
                ),
                'button2' => array(
                    'text' => get_post_meta($banner->ID, '_banner_button2_text', true),
                    'link' => get_post_meta($banner->ID, '_banner_button2_link', true),
                ),
                'image' => array(
                    'full' => wp_get_attachment_image_url($image_id, 'full'),
                    'large' => wp_get_attachment_image_url($image_id, 'large'),
                    'medium' => wp_get_attachment_image_url($image_id, 'medium'),
                    'thumbnail' => wp_get_attachment_image_url($image_id, 'thumbnail'),
                    'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
                ),
                'order' => (int) get_post_meta($banner->ID, '_banner_order', true) ?: 1,
                'status' => get_post_meta($banner->ID, '_banner_status', true) ?: 'active',
                'pages' => $pages,
            );
        }

        return rest_ensure_response($result);
    }
    
    /**
     * Add CORS headers for headless
     */
    public function add_cors_headers($served, $result, $request, $server) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        return $served;
    }
}
