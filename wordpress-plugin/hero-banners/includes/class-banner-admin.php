<?php
/**
 * Banner Admin Customizations
 *
 * @package Hero_Banners
 */

if (!defined('ABSPATH')) {
    exit;
}

class Banner_Admin {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_filter('manage_banner_posts_columns', array($this, 'add_custom_columns'));
        add_action('manage_banner_posts_custom_column', array($this, 'render_custom_columns'), 10, 2);
        add_filter('manage_edit-banner_sortable_columns', array($this, 'sortable_columns'));
        add_action('admin_notices', array($this, 'display_admin_notices'));
    }
    
    /**
     * Add custom columns
     */
    public function add_custom_columns($columns) {
        $new_columns = array();
        $new_columns['cb'] = $columns['cb'];
        $new_columns['image'] = __('Image', 'hero-banners');
        $new_columns['title'] = __('Title', 'hero-banners');
        $new_columns['subtitle'] = __('Subtitle', 'hero-banners');
        $new_columns['order'] = __('Order', 'hero-banners');
        $new_columns['status'] = __('Status', 'hero-banners');
        $new_columns['date'] = $columns['date'];
        
        return $new_columns;
    }
    
    /**
     * Render custom columns
     */
    public function render_custom_columns($column, $post_id) {
        switch ($column) {
            case 'image':
                if (has_post_thumbnail($post_id)) {
                    echo get_the_post_thumbnail($post_id, array(80, 80));
                } else {
                    echo '<span style="color: #999;">—</span>';
                }
                break;
                
            case 'subtitle':
                $subtitle = get_post_meta($post_id, '_banner_subtitle', true);
                echo $subtitle ? esc_html($subtitle) : '<span style="color: #999;">—</span>';
                break;
                
            case 'order':
                $order = get_post_meta($post_id, '_banner_order', true);
                echo '<strong>' . ($order ? esc_html($order) : '1') . '</strong>';
                break;
                
            case 'status':
                $status = get_post_meta($post_id, '_banner_status', true);
                $status = $status ?: 'active';
                $class = $status === 'active' ? 'status-active' : 'status-inactive';
                echo '<span class="' . esc_attr($class) . '">' . esc_html(ucfirst($status)) . '</span>';
                break;
        }
    }
    
    /**
     * Make columns sortable
     */
    public function sortable_columns($columns) {
        $columns['order'] = 'banner_order';
        $columns['status'] = 'banner_status';
        return $columns;
    }
    
    /**
     * Display admin notices
     */
    public function display_admin_notices() {
        $screen = get_current_screen();
        
        if ($screen->post_type !== 'banner') {
            return;
        }
        
        // Show activation notice
        if (get_option('hero_banners_activated')) {
            ?>
            <div class="notice notice-success is-dismissible">
                <p><strong><?php _e('Hero Banners is active!', 'hero-banners'); ?></strong></p>
                <p><?php _e('API Endpoints:', 'hero-banners'); ?></p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><code><?php echo esc_url(rest_url('hero-banners/v1/active')); ?></code> - <?php _e('Active banners only', 'hero-banners'); ?></li>
                    <li><code><?php echo esc_url(rest_url('hero-banners/v1/all')); ?></code> - <?php _e('All published banners', 'hero-banners'); ?></li>
                    <li><code><?php echo esc_url(rest_url('wp/v2/banners')); ?></code> - <?php _e('WordPress REST API', 'hero-banners'); ?></li>
                </ul>
            </div>
            <?php
            delete_option('hero_banners_activated');
        }
    }
}
