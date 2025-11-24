<?php
/**
 * Plugin Name: Hero Banners
 * Plugin URI: https://finditq.com
 * Description: Professional banner management system for headless WordPress with REST API support and page-specific banner assignments
 * Version: 1.1.0
 * Author: Rashidavc
 * Author URI: https://finditq.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: hero-banners
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HERO_BANNERS_VERSION', '1.1.0');
define('HERO_BANNERS_PATH', plugin_dir_path(__FILE__));
define('HERO_BANNERS_URL', plugin_dir_url(__FILE__));
define('HERO_BANNERS_BASENAME', plugin_basename(__FILE__));

// Require dependencies
require_once HERO_BANNERS_PATH . 'includes/class-banner-cpt.php';
require_once HERO_BANNERS_PATH . 'includes/class-banner-meta.php';
require_once HERO_BANNERS_PATH . 'includes/class-banner-rest.php';
require_once HERO_BANNERS_PATH . 'includes/class-banner-admin.php';

/**
 * Main Plugin Class
 */
class Hero_Banners {
    
    private static $instance = null;
    
    /**
     * Get instance (Singleton pattern)
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Initialize components
        add_action('plugins_loaded', array($this, 'init_components'));
        
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Load text domain
        add_action('init', array($this, 'load_textdomain'));
    }
    
    /**
     * Initialize plugin components
     */
    public function init_components() {
        Banner_CPT::get_instance();
        Banner_Meta::get_instance();
        Banner_REST::get_instance();
        Banner_Admin::get_instance();
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Register CPT
        Banner_CPT::get_instance()->register_post_type();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Set activation flag
        add_option('hero_banners_activated', time());
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Load text domain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'hero-banners',
            false,
            dirname(HERO_BANNERS_BASENAME) . '/languages'
        );
    }
}

/**
 * Initialize plugin
 */
function hero_banners() {
    return Hero_Banners::get_instance();
}

// Start the plugin
hero_banners();
