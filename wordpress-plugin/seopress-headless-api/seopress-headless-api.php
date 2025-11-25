<?php
/**
 * Plugin Name: SEOPress Headless API
 * Plugin URI: https://lebakestories.com
 * Description: Exposes SEOPress metadata via WordPress REST API for headless implementations
 * Version: 1.0.0
 * Author: Le Bake Stories
 * Author URI: https://lebakestories.com
 * License: GPL v2 or later
 * Text Domain: seopress-headless-api
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * SEOPress Headless API Class
 */
class SEOPress_Headless_API {
    
    /**
     * Constructor
     */
    public function __construct() {
        // Add SEOPress data to posts
        add_action('rest_api_init', array($this, 'register_seopress_fields'));
        
        // Add custom endpoint for SEO data
        add_action('rest_api_init', array($this, 'register_seo_endpoint'));
        
        // Add global SEO settings endpoint
        add_action('rest_api_init', array($this, 'register_global_seo_endpoint'));
        
        // Add admin verification endpoint
        add_action('rest_api_init', array($this, 'register_admin_verification_endpoint'));
        
        // Add SEO update endpoint (for admins only)
        add_action('rest_api_init', array($this, 'register_seo_update_endpoint'));
    }
    
    /**
     * Register SEOPress fields in REST API
     */
    public function register_seopress_fields() {
        // For posts
        register_rest_field('post', 'seopress_meta', array(
            'get_callback' => array($this, 'get_seopress_meta'),
            'schema' => null,
        ));
        
        // For pages
        register_rest_field('page', 'seopress_meta', array(
            'get_callback' => array($this, 'get_seopress_meta'),
            'schema' => null,
        ));
        
        // For products
        register_rest_field('product', 'seopress_meta', array(
            'get_callback' => array($this, 'get_seopress_meta'),
            'schema' => null,
        ));
        
        // For categories
        register_rest_field('category', 'seopress_meta', array(
            'get_callback' => array($this, 'get_seopress_taxonomy_meta'),
            'schema' => null,
        ));
        
        // For product categories
        register_rest_field('product_cat', 'seopress_meta', array(
            'get_callback' => array($this, 'get_seopress_taxonomy_meta'),
            'schema' => null,
        ));
    }
    
    /**
     * Get SEOPress meta data for posts/pages/products
     */
    public function get_seopress_meta($object) {
        $post_id = $object['id'];
        
        $seo_data = array(
            'title' => $this->get_meta_title($post_id),
            'description' => $this->get_meta_description($post_id),
            'canonical' => $this->get_canonical_url($post_id),
            'robots' => $this->get_robots_meta($post_id),
            'og_title' => $this->get_og_title($post_id),
            'og_description' => $this->get_og_description($post_id),
            'og_image' => $this->get_og_image($post_id),
            'twitter_title' => $this->get_twitter_title($post_id),
            'twitter_description' => $this->get_twitter_description($post_id),
            'twitter_image' => $this->get_twitter_image($post_id),
            'breadcrumbs' => $this->get_breadcrumbs($post_id),
            'schema' => $this->get_schema_data($post_id),
        );
        
        return $seo_data;
    }
    
    /**
     * Get SEOPress meta data for taxonomies
     */
    public function get_seopress_taxonomy_meta($object) {
        $term_id = $object['id'];
        $taxonomy = $object['taxonomy'];
        
        $seo_data = array(
            'title' => get_term_meta($term_id, '_seopress_titles_title', true),
            'description' => get_term_meta($term_id, '_seopress_titles_desc', true),
            'og_title' => get_term_meta($term_id, '_seopress_social_fb_title', true),
            'og_description' => get_term_meta($term_id, '_seopress_social_fb_desc', true),
            'og_image' => get_term_meta($term_id, '_seopress_social_fb_img', true),
            'twitter_title' => get_term_meta($term_id, '_seopress_social_twitter_title', true),
            'twitter_description' => get_term_meta($term_id, '_seopress_social_twitter_desc', true),
            'twitter_image' => get_term_meta($term_id, '_seopress_social_twitter_img', true),
            'robots' => array(
                'noindex' => get_term_meta($term_id, '_seopress_robots_index', true) === 'yes',
                'nofollow' => get_term_meta($term_id, '_seopress_robots_follow', true) === 'yes',
            ),
        );
        
        return $seo_data;
    }
    
    /**
     * Get meta title
     */
    private function get_meta_title($post_id) {
        $title = get_post_meta($post_id, '_seopress_titles_title', true);
        
        if (empty($title)) {
            $title = get_the_title($post_id);
            $site_title = get_bloginfo('name');
            $separator = get_option('seopress_titles_sep') ?: '-';
            $title = $title . ' ' . $separator . ' ' . $site_title;
        }
        
        return $title;
    }
    
    /**
     * Get meta description
     */
    private function get_meta_description($post_id) {
        $description = get_post_meta($post_id, '_seopress_titles_desc', true);
        
        if (empty($description)) {
            $post = get_post($post_id);
            $description = wp_trim_words($post->post_excerpt ?: $post->post_content, 20, '...');
        }
        
        return $description;
    }
    
    /**
     * Get canonical URL
     */
    private function get_canonical_url($post_id) {
        $canonical = get_post_meta($post_id, '_seopress_robots_canonical', true);
        
        if (empty($canonical)) {
            $canonical = get_permalink($post_id);
        }
        
        return $canonical;
    }
    
    /**
     * Get robots meta
     */
    private function get_robots_meta($post_id) {
        return array(
            'noindex' => get_post_meta($post_id, '_seopress_robots_index', true) === 'yes',
            'nofollow' => get_post_meta($post_id, '_seopress_robots_follow', true) === 'yes',
            'noarchive' => get_post_meta($post_id, '_seopress_robots_archive', true) === 'yes',
            'nosnippet' => get_post_meta($post_id, '_seopress_robots_snippet', true) === 'yes',
            'noimageindex' => get_post_meta($post_id, '_seopress_robots_imageindex', true) === 'yes',
        );
    }
    
    /**
     * Get Open Graph title
     */
    private function get_og_title($post_id) {
        $og_title = get_post_meta($post_id, '_seopress_social_fb_title', true);
        return $og_title ?: $this->get_meta_title($post_id);
    }
    
    /**
     * Get Open Graph description
     */
    private function get_og_description($post_id) {
        $og_desc = get_post_meta($post_id, '_seopress_social_fb_desc', true);
        return $og_desc ?: $this->get_meta_description($post_id);
    }
    
    /**
     * Get Open Graph image
     */
    private function get_og_image($post_id) {
        $og_image = get_post_meta($post_id, '_seopress_social_fb_img', true);
        
        if (empty($og_image)) {
            $thumbnail_id = get_post_thumbnail_id($post_id);
            if ($thumbnail_id) {
                $image = wp_get_attachment_image_src($thumbnail_id, 'full');
                $og_image = $image[0];
            }
        }
        
        return $og_image;
    }
    
    /**
     * Get Twitter title
     */
    private function get_twitter_title($post_id) {
        $twitter_title = get_post_meta($post_id, '_seopress_social_twitter_title', true);
        return $twitter_title ?: $this->get_og_title($post_id);
    }
    
    /**
     * Get Twitter description
     */
    private function get_twitter_description($post_id) {
        $twitter_desc = get_post_meta($post_id, '_seopress_social_twitter_desc', true);
        return $twitter_desc ?: $this->get_og_description($post_id);
    }
    
    /**
     * Get Twitter image
     */
    private function get_twitter_image($post_id) {
        $twitter_image = get_post_meta($post_id, '_seopress_social_twitter_img', true);
        return $twitter_image ?: $this->get_og_image($post_id);
    }
    
    /**
     * Get breadcrumbs
     */
    private function get_breadcrumbs($post_id) {
        $post = get_post($post_id);
        $breadcrumbs = array();
        
        // Home
        $breadcrumbs[] = array(
            'name' => 'Home',
            'url' => home_url('/'),
        );
        
        // Categories/taxonomies
        if ($post->post_type === 'post') {
            $categories = get_the_category($post_id);
            if (!empty($categories)) {
                $category = $categories[0];
                $breadcrumbs[] = array(
                    'name' => $category->name,
                    'url' => get_category_link($category->term_id),
                );
            }
        } elseif ($post->post_type === 'product') {
            $terms = get_the_terms($post_id, 'product_cat');
            if (!empty($terms) && !is_wp_error($terms)) {
                $term = $terms[0];
                $breadcrumbs[] = array(
                    'name' => $term->name,
                    'url' => get_term_link($term->term_id, 'product_cat'),
                );
            }
        }
        
        // Current page
        $breadcrumbs[] = array(
            'name' => get_the_title($post_id),
            'url' => get_permalink($post_id),
        );
        
        return $breadcrumbs;
    }
    
    /**
     * Get schema data
     */
    private function get_schema_data($post_id) {
        // Get schema from SEOPress if available
        $schema = get_post_meta($post_id, '_seopress_pro_rich_snippets_type', true);
        
        return $schema ?: null;
    }
    
    /**
     * Register custom SEO endpoint
     */
    public function register_seo_endpoint() {
        register_rest_route('seopress/v1', '/seo/(?P<type>[a-zA-Z0-9_-]+)/(?P<slug>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_seo_data'),
            'permission_callback' => '__return_true',
        ));
    }
    
    /**
     * Get SEO data callback
     */
    public function get_seo_data($request) {
        $type = $request->get_param('type');
        $slug = $request->get_param('slug');
        
        // Get post by slug
        $args = array(
            'name' => $slug,
            'post_type' => $type,
            'posts_per_page' => 1,
        );
        
        $posts = get_posts($args);
        
        if (empty($posts)) {
            return new WP_Error('not_found', 'Content not found', array('status' => 404));
        }
        
        $post = $posts[0];
        $seo_data = $this->get_seopress_meta(array('id' => $post->ID));
        
        return rest_ensure_response($seo_data);
    }
    
    /**
     * Register global SEO settings endpoint
     */
    public function register_global_seo_endpoint() {
        register_rest_route('seopress/v1', '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_global_seo_settings'),
            'permission_callback' => '__return_true',
        ));
    }
    
    /**
     * Get global SEO settings
     */
    public function get_global_seo_settings() {
        $settings = array(
            'site_name' => get_bloginfo('name'),
            'site_description' => get_bloginfo('description'),
            'site_url' => home_url('/'),
            'separator' => get_option('seopress_titles_sep') ?: '-',
            'social' => array(
                'facebook_app_id' => get_option('seopress_social_facebook_app_id'),
                'twitter_site' => get_option('seopress_social_accounts_twitter'),
                'og_locale' => get_option('seopress_social_facebook_locale') ?: 'en_US',
            ),
            'google_analytics' => array(
                'id' => get_option('seopress_google_analytics_ga4'),
            ),
            'verification' => array(
                'google' => get_option('seopress_advanced_google'),
                'bing' => get_option('seopress_advanced_bing'),
                'pinterest' => get_option('seopress_advanced_pinterest'),
            ),
        );
        
        return rest_ensure_response($settings);
    }
    
    /**
     * Register admin verification endpoint
     */
    public function register_admin_verification_endpoint() {
        register_rest_route('seopress/v1', '/verify-admin', array(
            'methods' => 'GET',
            'callback' => array($this, 'verify_admin'),
            'permission_callback' => array($this, 'check_jwt_auth'),
        ));
    }
    
    /**
     * Register SEO update endpoint
     */
    public function register_seo_update_endpoint() {
        register_rest_route('seopress/v1', '/update/(?P<post_id>\d+)', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_seo_data'),
            'permission_callback' => array($this, 'check_admin_permission'),
            'args' => array(
                'post_id' => array(
                    'validate_callback' => function($param, $request, $key) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));
    }
    
    /**
     * Check if user is authenticated via JWT
     */
    public function check_jwt_auth() {
        // Get authorization header
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        
        if (empty($auth_header)) {
            return false;
        }
        
        // Try to decode JWT token
        list($token) = sscanf($auth_header, 'Bearer %s');
        
        if (!$token) {
            return false;
        }
        
        // If we have a token, user is authenticated
        // The JWT plugin will handle actual validation
        return true;
    }
    
    /**
     * Check if user has admin permission
     */
    public function check_admin_permission($request) {
        // First check if authenticated
        if (!$this->check_jwt_auth()) {
            return new WP_Error('rest_forbidden', 'You are not authenticated.', array('status' => 401));
        }
        
        // Get current user from JWT
        $user = wp_get_current_user();
        
        if (!$user || $user->ID === 0) {
            return new WP_Error('rest_forbidden', 'Could not verify user.', array('status' => 401));
        }
        
        // Check if user has admin capabilities
        if (!user_can($user, 'manage_options') && !user_can($user, 'edit_posts')) {
            return new WP_Error('rest_forbidden', 'You do not have permission to edit SEO data.', array('status' => 403));
        }
        
        return true;
    }
    
    /**
     * Verify if user is admin
     */
    public function verify_admin($request) {
        $user = wp_get_current_user();
        
        if (!$user || $user->ID === 0) {
            return new WP_Error('rest_forbidden', 'User not found.', array('status' => 401));
        }
        
        $is_admin = user_can($user, 'manage_options');
        $can_edit_posts = user_can($user, 'edit_posts');
        
        return rest_ensure_response(array(
            'is_admin' => $is_admin,
            'can_edit_posts' => $can_edit_posts,
            'user_id' => $user->ID,
            'user_email' => $user->user_email,
            'user_roles' => $user->roles,
            'display_name' => $user->display_name,
        ));
    }
    
    /**
     * Update SEO data for a post
     */
    public function update_seo_data($request) {
        $post_id = $request->get_param('post_id');
        $seo_data = $request->get_json_params();
        
        if (!$post_id) {
            return new WP_Error('invalid_post_id', 'Invalid post ID.', array('status' => 400));
        }
        
        // Verify post exists
        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('post_not_found', 'Post not found.', array('status' => 404));
        }
        
        // Update SEOPress meta fields
        $updated_fields = array();
        
        if (isset($seo_data['title'])) {
            update_post_meta($post_id, '_seopress_titles_title', sanitize_text_field($seo_data['title']));
            $updated_fields[] = 'title';
        }
        
        if (isset($seo_data['description'])) {
            update_post_meta($post_id, '_seopress_titles_desc', sanitize_textarea_field($seo_data['description']));
            $updated_fields[] = 'description';
        }
        
        if (isset($seo_data['canonical'])) {
            update_post_meta($post_id, '_seopress_robots_canonical', esc_url_raw($seo_data['canonical']));
            $updated_fields[] = 'canonical';
        }
        
        // Robots meta
        if (isset($seo_data['robots'])) {
            if (isset($seo_data['robots']['noindex'])) {
                update_post_meta($post_id, '_seopress_robots_index', $seo_data['robots']['noindex'] ? 'yes' : '');
                $updated_fields[] = 'noindex';
            }
            if (isset($seo_data['robots']['nofollow'])) {
                update_post_meta($post_id, '_seopress_robots_follow', $seo_data['robots']['nofollow'] ? 'yes' : '');
                $updated_fields[] = 'nofollow';
            }
            if (isset($seo_data['robots']['noarchive'])) {
                update_post_meta($post_id, '_seopress_robots_archive', $seo_data['robots']['noarchive'] ? 'yes' : '');
                $updated_fields[] = 'noarchive';
            }
            if (isset($seo_data['robots']['nosnippet'])) {
                update_post_meta($post_id, '_seopress_robots_snippet', $seo_data['robots']['nosnippet'] ? 'yes' : '');
                $updated_fields[] = 'nosnippet';
            }
            if (isset($seo_data['robots']['noimageindex'])) {
                update_post_meta($post_id, '_seopress_robots_imageindex', $seo_data['robots']['noimageindex'] ? 'yes' : '');
                $updated_fields[] = 'noimageindex';
            }
        }
        
        // Open Graph
        if (isset($seo_data['og_title'])) {
            update_post_meta($post_id, '_seopress_social_fb_title', sanitize_text_field($seo_data['og_title']));
            $updated_fields[] = 'og_title';
        }
        
        if (isset($seo_data['og_description'])) {
            update_post_meta($post_id, '_seopress_social_fb_desc', sanitize_textarea_field($seo_data['og_description']));
            $updated_fields[] = 'og_description';
        }
        
        if (isset($seo_data['og_image'])) {
            update_post_meta($post_id, '_seopress_social_fb_img', esc_url_raw($seo_data['og_image']));
            $updated_fields[] = 'og_image';
        }
        
        // Twitter
        if (isset($seo_data['twitter_title'])) {
            update_post_meta($post_id, '_seopress_social_twitter_title', sanitize_text_field($seo_data['twitter_title']));
            $updated_fields[] = 'twitter_title';
        }
        
        if (isset($seo_data['twitter_description'])) {
            update_post_meta($post_id, '_seopress_social_twitter_desc', sanitize_textarea_field($seo_data['twitter_description']));
            $updated_fields[] = 'twitter_description';
        }
        
        if (isset($seo_data['twitter_image'])) {
            update_post_meta($post_id, '_seopress_social_twitter_img', esc_url_raw($seo_data['twitter_image']));
            $updated_fields[] = 'twitter_image';
        }
        
        // Get updated SEO data
        $updated_seo_data = $this->get_seopress_meta(array('id' => $post_id));
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'SEO data updated successfully',
            'updated_fields' => $updated_fields,
            'post_id' => $post_id,
            'seo_data' => $updated_seo_data,
        ));
    }
}

// Initialize the plugin
new SEOPress_Headless_API();

