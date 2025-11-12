<?php
/**
 * Banner Custom Post Type
 *
 * @package Hero_Banners
 */

if (!defined('ABSPATH')) {
    exit;
}

class Banner_CPT {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('init', array($this, 'register_post_type'));
    }
    
    /**
     * Register Banner Post Type
     */
    public function register_post_type() {
        $labels = array(
            'name'                  => _x('Banners', 'Post type general name', 'hero-banners'),
            'singular_name'         => _x('Banner', 'Post type singular name', 'hero-banners'),
            'menu_name'            => _x('Hero Banners', 'Admin Menu text', 'hero-banners'),
            'name_admin_bar'       => _x('Banner', 'Add New on Toolbar', 'hero-banners'),
            'add_new'              => __('Add New', 'hero-banners'),
            'add_new_item'         => __('Add New Banner', 'hero-banners'),
            'new_item'             => __('New Banner', 'hero-banners'),
            'edit_item'            => __('Edit Banner', 'hero-banners'),
            'view_item'            => __('View Banner', 'hero-banners'),
            'all_items'            => __('All Banners', 'hero-banners'),
            'search_items'         => __('Search Banners', 'hero-banners'),
            'parent_item_colon'    => __('Parent Banners:', 'hero-banners'),
            'not_found'            => __('No banners found.', 'hero-banners'),
            'not_found_in_trash'   => __('No banners found in Trash.', 'hero-banners'),
            'featured_image'       => _x('Banner Image', 'Overrides the "Featured Image" phrase', 'hero-banners'),
            'set_featured_image'   => _x('Set banner image', 'Overrides the "Set featured image" phrase', 'hero-banners'),
            'remove_featured_image' => _x('Remove banner image', 'Overrides the "Remove featured image" phrase', 'hero-banners'),
            'use_featured_image'   => _x('Use as banner image', 'Overrides the "Use as featured image" phrase', 'hero-banners'),
        );

        $args = array(
            'labels'             => $labels,
            'public'             => false,
            'publicly_queryable' => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'rewrite'            => false,
            'capability_type'    => 'post',
            'has_archive'        => false,
            'hierarchical'       => false,
            'menu_position'      => 20,
            'menu_icon'          => 'dashicons-slides',
            'supports'           => array('title', 'thumbnail'),
            'show_in_rest'       => true,
            'rest_base'          => 'banners',
            'rest_controller_class' => 'WP_REST_Posts_Controller',
        );

        register_post_type('banner', $args);
    }
}
