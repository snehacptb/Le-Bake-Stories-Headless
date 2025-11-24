<?php
/**
 * Banner Meta Boxes
 *
 * @package Hero_Banners
 */

if (!defined('ABSPATH')) {
    exit;
}

class Banner_Meta {
    
    private static $instance = null;
    
    private $meta_fields = array(
        '_banner_subtitle',
        '_banner_title',
        '_banner_button1_text',
        '_banner_button1_link',
        '_banner_button2_text',
        '_banner_button2_link',
        '_banner_order',
        '_banner_status',
        '_banner_pages',
    );
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post_banner', array($this, 'save_meta_boxes'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }
    
    /**
     * Add meta boxes
     */
    public function add_meta_boxes() {
        add_meta_box(
            'banner_details',
            __('Banner Details', 'hero-banners'),
            array($this, 'render_meta_box'),
            'banner',
            'normal',
            'high'
        );
        
        add_meta_box(
            'banner_settings',
            __('Banner Settings', 'hero-banners'),
            array($this, 'render_settings_box'),
            'banner',
            'side',
            'default'
        );
    }
    
    /**
     * Render main meta box
     */
    public function render_meta_box($post) {
        wp_nonce_field('banner_meta_nonce', 'banner_meta_nonce');
        
        $subtitle = get_post_meta($post->ID, '_banner_subtitle', true);
        $title = get_post_meta($post->ID, '_banner_title', true);
        $button1_text = get_post_meta($post->ID, '_banner_button1_text', true);
        $button1_link = get_post_meta($post->ID, '_banner_button1_link', true);
        $button2_text = get_post_meta($post->ID, '_banner_button2_text', true);
        $button2_link = get_post_meta($post->ID, '_banner_button2_link', true);
        ?>
        <div class="banner-meta-box">
            <table class="form-table">
                <tr>
                    <th><label for="banner_subtitle"><?php _e('Subtitle', 'hero-banners'); ?></label></th>
                    <td>
                        <input type="text" 
                               id="banner_subtitle" 
                               name="banner_subtitle" 
                               value="<?php echo esc_attr($subtitle); ?>" 
                               class="large-text" 
                               placeholder="<?php esc_attr_e('ELEVATE YOUR STYLE', 'hero-banners'); ?>" />
                        <p class="description"><?php _e('Small text above the main title', 'hero-banners'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="banner_title"><?php _e('Main Title', 'hero-banners'); ?></label></th>
                    <td>
                        <textarea id="banner_title" 
                                  name="banner_title" 
                                  rows="3" 
                                  class="large-text" 
                                  placeholder="<?php esc_attr_e('Discover timeless luxury with our exclusive collections', 'hero-banners'); ?>"><?php echo esc_textarea($title); ?></textarea>
                        <p class="description"><?php _e('Main banner headline', 'hero-banners'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th colspan="2"><h3><?php _e('Primary Button', 'hero-banners'); ?></h3></th>
                </tr>
                <tr>
                    <th><label for="banner_button1_text"><?php _e('Button 1 Text', 'hero-banners'); ?></label></th>
                    <td>
                        <input type="text" 
                               id="banner_button1_text" 
                               name="banner_button1_text" 
                               value="<?php echo esc_attr($button1_text); ?>" 
                               class="large-text" 
                               placeholder="<?php esc_attr_e('VIEW MORE', 'hero-banners'); ?>" />
                    </td>
                </tr>
                <tr>
                    <th><label for="banner_button1_link"><?php _e('Button 1 Link', 'hero-banners'); ?></label></th>
                    <td>
                        <input type="url" 
                               id="banner_button1_link" 
                               name="banner_button1_link" 
                               value="<?php echo esc_url($button1_link); ?>" 
                               class="large-text" 
                               placeholder="https://" />
                    </td>
                </tr>
                <tr>
                    <th colspan="2"><h3><?php _e('Secondary Button', 'hero-banners'); ?></h3></th>
                </tr>
                <tr>
                    <th><label for="banner_button2_text"><?php _e('Button 2 Text', 'hero-banners'); ?></label></th>
                    <td>
                        <input type="text" 
                               id="banner_button2_text" 
                               name="banner_button2_text" 
                               value="<?php echo esc_attr($button2_text); ?>" 
                               class="large-text" 
                               placeholder="<?php esc_attr_e('TO SHOP', 'hero-banners'); ?>" />
                    </td>
                </tr>
                <tr>
                    <th><label for="banner_button2_link"><?php _e('Button 2 Link', 'hero-banners'); ?></label></th>
                    <td>
                        <input type="url" 
                               id="banner_button2_link" 
                               name="banner_button2_link" 
                               value="<?php echo esc_url($button2_link); ?>" 
                               class="large-text" 
                               placeholder="https://" />
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }
    
    /**
     * Render settings box
     */
    public function render_settings_box($post) {
        $order = get_post_meta($post->ID, '_banner_order', true);
        $status = get_post_meta($post->ID, '_banner_status', true);
        $selected_pages = get_post_meta($post->ID, '_banner_pages', true);
        $selected_pages = $selected_pages ? $selected_pages : array();
        
        // Get all pages
        $pages = get_pages(array(
            'sort_column' => 'post_title',
            'sort_order' => 'ASC',
        ));
        ?>
        <div class="banner-settings-box">
            <p>
                <label for="banner_order"><strong><?php _e('Display Order', 'hero-banners'); ?></strong></label><br>
                <input type="number" 
                       id="banner_order" 
                       name="banner_order" 
                       value="<?php echo esc_attr($order ?: 1); ?>" 
                       min="1" 
                       style="width: 100%;" />
                <span class="description"><?php _e('Lower numbers appear first', 'hero-banners'); ?></span>
            </p>
            
            <p>
                <label for="banner_status"><strong><?php _e('Status', 'hero-banners'); ?></strong></label><br>
                <select id="banner_status" name="banner_status" style="width: 100%;">
                    <option value="active" <?php selected($status, 'active'); ?>><?php _e('Active', 'hero-banners'); ?></option>
                    <option value="inactive" <?php selected($status, 'inactive'); ?>><?php _e('Inactive', 'hero-banners'); ?></option>
                </select>
            </p>
            
            <p>
                <label><strong><?php _e('Display on Pages', 'hero-banners'); ?></strong></label><br>
                <span class="description"><?php _e('Select pages where this banner should appear', 'hero-banners'); ?></span>
            </p>
            
            <div class="banner-pages-list" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 8px; background: #f9f9f9;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" 
                           name="banner_pages[]" 
                           value="all" 
                           <?php checked(in_array('all', $selected_pages)); ?> />
                    <strong><?php _e('All Pages', 'hero-banners'); ?></strong>
                </label>
                
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" 
                           name="banner_pages[]" 
                           value="home" 
                           <?php checked(in_array('home', $selected_pages)); ?> />
                    <strong><?php _e('Home Page', 'hero-banners'); ?></strong>
                </label>
                
                <?php foreach ($pages as $page) : ?>
                    <label style="display: block; margin-bottom: 5px;">
                        <input type="checkbox" 
                               name="banner_pages[]" 
                               value="<?php echo esc_attr($page->ID); ?>" 
                               <?php checked(in_array((string)$page->ID, $selected_pages)); ?> />
                        <?php echo esc_html($page->post_title); ?>
                    </label>
                <?php endforeach; ?>
                
                <?php if (empty($pages)) : ?>
                    <p class="description"><?php _e('No pages found. Create pages to assign banners to them.', 'hero-banners'); ?></p>
                <?php endif; ?>
            </div>
            
            <div class="banner-info" style="margin-top: 15px;">
                <h4><?php _e('Featured Image', 'hero-banners'); ?></h4>
                <p class="description"><?php _e('Set the featured image as the banner background. Recommended size: 1920x1080px', 'hero-banners'); ?></p>
            </div>
        </div>
        <?php
    }
    
    /**
     * Save meta boxes
     */
    public function save_meta_boxes($post_id) {
        // Verify nonce
        if (!isset($_POST['banner_meta_nonce']) || !wp_verify_nonce($_POST['banner_meta_nonce'], 'banner_meta_nonce')) {
            return;
        }

        // Check autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        // Save fields
        $fields = array(
            '_banner_subtitle' => 'sanitize_text_field',
            '_banner_title' => 'sanitize_textarea_field',
            '_banner_button1_text' => 'sanitize_text_field',
            '_banner_button1_link' => 'esc_url_raw',
            '_banner_button2_text' => 'sanitize_text_field',
            '_banner_button2_link' => 'esc_url_raw',
            '_banner_order' => 'absint',
            '_banner_status' => 'sanitize_text_field',
        );

        foreach ($fields as $field => $sanitize_callback) {
            $key = str_replace('_banner_', 'banner_', $field);
            if (isset($_POST[$key])) {
                $value = $sanitize_callback($_POST[$key]);
                update_post_meta($post_id, $field, $value);
            }
        }
        
        // Save pages (array field)
        if (isset($_POST['banner_pages']) && is_array($_POST['banner_pages'])) {
            $pages = array_map('sanitize_text_field', $_POST['banner_pages']);
            update_post_meta($post_id, '_banner_pages', $pages);
        } else {
            // If no pages selected, save empty array
            update_post_meta($post_id, '_banner_pages', array());
        }
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        global $post_type;
        
        if ($post_type !== 'banner') {
            return;
        }
        
        wp_enqueue_style(
            'hero-banners-admin',
            HERO_BANNERS_URL . 'assets/css/admin.css',
            array(),
            HERO_BANNERS_VERSION
        );
    }
}
