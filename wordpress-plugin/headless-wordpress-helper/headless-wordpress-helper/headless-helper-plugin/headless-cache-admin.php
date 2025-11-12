<?php
/**
 * Headless Cache Admin Handler
 * 
 * Provides WordPress admin interface for managing Next.js cache
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Headless Cache Admin Handler Class
 */
class HeadlessCacheAdminHandler {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('wp_ajax_refresh_nextjs_cache', array($this, 'handle_cache_refresh'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // Add cache refresh button to admin bar
        add_action('admin_bar_menu', array($this, 'add_admin_bar_cache_button'), 100);
        
        // Auto-refresh cache on content updates
        add_action('save_post', array($this, 'auto_refresh_cache_on_save'), 10, 3);
        add_action('wp_update_nav_menu', array($this, 'auto_refresh_cache_on_menu_update'));
        add_action('customize_save_after', array($this, 'auto_refresh_cache_on_customizer_save'));
    }
    
    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_options_page(
            __('Cache Management', 'headless-helper'),
            __('Cache Management', 'headless-helper'),
            'manage_options',
            'headless-cache-management',
            array($this, 'admin_page_callback')
        );
    }
    
    /**
     * Add cache refresh button to admin bar
     */
    public function add_admin_bar_cache_button($wp_admin_bar) {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        $wp_admin_bar->add_node(array(
            'id'    => 'refresh-nextjs-cache',
            'title' => '<span class="ab-icon dashicons dashicons-update" style="margin-top: 2px;"></span> ' . __('Refresh Cache', 'headless-helper'),
            'href'  => '#',
            'meta'  => array(
                'class' => 'refresh-cache-button',
                'onclick' => 'refreshNextjsCache(); return false;'
            )
        ));
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        // Only load on our admin page or when admin bar is present
        if ($hook === 'settings_page_headless-cache-management' || is_admin_bar_showing()) {
            wp_enqueue_script('jquery');
            
            // Add inline script for cache refresh functionality
            $script = "
            function refreshNextjsCache() {
                var button = jQuery('.refresh-cache-btn, .refresh-cache-button');
                var originalText = button.text();
                
                button.prop('disabled', true).text('Refreshing...');
                
                jQuery.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'refresh_nextjs_cache',
                        nonce: '" . wp_create_nonce('refresh_cache_nonce') . "'
                    },
                    success: function(response) {
                        if (response.success) {
                            button.text('✓ Cache Refreshed!').css('background-color', '#46b450');
                            if (jQuery('.cache-status')) {
                                jQuery('.cache-status').html('<div class=\"notice notice-success\"><p>' + response.data.message + '</p></div>');
                            }
                            setTimeout(function() {
                                button.text(originalText).css('background-color', '').prop('disabled', false);
                            }, 3000);
                        } else {
                            button.text('✗ Failed').css('background-color', '#dc3232');
                            if (jQuery('.cache-status')) {
                                jQuery('.cache-status').html('<div class=\"notice notice-error\"><p>' + response.data.message + '</p></div>');
                            }
                            setTimeout(function() {
                                button.text(originalText).css('background-color', '').prop('disabled', false);
                            }, 3000);
                        }
                    },
                    error: function() {
                        button.text('✗ Error').css('background-color', '#dc3232');
                        if (jQuery('.cache-status')) {
                            jQuery('.cache-status').html('<div class=\"notice notice-error\"><p>Network error occurred</p></div>');
                        }
                        setTimeout(function() {
                            button.text(originalText).css('background-color', '').prop('disabled', false);
                        }, 3000);
                    }
                });
            }
            
            jQuery(document).ready(function($) {
                $('.refresh-cache-btn').on('click', refreshNextjsCache);
                
                // Auto-refresh toggle
                $('#auto_refresh_enabled').on('change', function() {
                    var enabled = $(this).is(':checked');
                    $.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'toggle_auto_refresh',
                            enabled: enabled ? 1 : 0,
                            nonce: '" . wp_create_nonce('toggle_auto_refresh_nonce') . "'
                        }
                    });
                });
            });
            ";
            
            wp_add_inline_script('jquery', $script);
        }
    }
    
    /**
     * Handle AJAX cache refresh request
     */
    public function handle_cache_refresh() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'refresh_cache_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
            return;
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }
        
        $result = $this->trigger_cache_refresh();
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * Trigger cache refresh via API
     */
    private function trigger_cache_refresh() {
        $settings = get_option('headless_cache_settings', array());
        $frontend_url = !empty($settings['frontend_url']) ? $settings['frontend_url'] : 'http://localhost:3000';
        $secret_key = !empty($settings['secret_key']) ? $settings['secret_key'] : '8f7e6d5c4b3a2190fedcba0987654321';
        
        $api_url = rtrim($frontend_url, '/') . '/api/cache/init?secret=' . $secret_key;
        
        $response = wp_remote_get($api_url, array(
            'timeout' => 45, // Increased timeout for cache operations
            'headers' => array(
                'User-Agent' => 'WordPress/Headless-Helper'
            )
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => 'Failed to connect to Next.js frontend: ' . $response->get_error_message()
            );
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        if ($response_code === 200) {
            // Update last refresh time
            update_option('headless_cache_last_refresh', current_time('mysql'));
            
            // Try to parse response for detailed feedback
            $response_data = json_decode($response_body, true);
            $detailed_message = 'Cache refreshed successfully!';
            
            if ($response_data && isset($response_data['results'])) {
                $results = $response_data['results'];
                $detailed_message = sprintf(
                    'Cache refreshed successfully! %d operations completed (%d successful, %d failed)',
                    $results['total'],
                    $results['successful'],
                    $results['failed']
                );
                
                // Add failure details if any
                if ($results['failed'] > 0 && isset($results['failures'])) {
                    $failed_types = array_column($results['failures'], 'type');
                    $detailed_message .= '. Failed: ' . implode(', ', $failed_types);
                }
            }
            
            return array(
                'success' => true,
                'message' => $detailed_message,
                'response_code' => $response_code,
                'response_data' => $response_data,
                'timestamp' => current_time('mysql')
            );
        } else {
            // Try to get more detailed error information
            $error_message = 'Cache refresh failed. Response code: ' . $response_code;
            $response_data = json_decode($response_body, true);
            
            if ($response_data && isset($response_data['message'])) {
                $error_message = $response_data['message'];
            } elseif ($response_data && isset($response_data['error'])) {
                $error_message = $response_data['error'];
            }
            
            return array(
                'success' => false,
                'message' => $error_message,
                'response_code' => $response_code,
                'response_body' => $response_body
            );
        }
    }
    
    /**
     * Auto-refresh cache on post save
     */
    public function auto_refresh_cache_on_save($post_id, $post, $update) {
        $settings = get_option('headless_cache_settings', array());
        
        if (empty($settings['auto_refresh_enabled'])) {
            return;
        }
        
        // Skip for autosaves, revisions, and drafts
        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id) || $post->post_status !== 'publish') {
            return;
        }
        
        // Only refresh for public post types
        $post_type = get_post_type($post_id);
        $public_post_types = get_post_types(array('public' => true));
        
        if (!in_array($post_type, $public_post_types)) {
            return;
        }
        
        // Trigger cache refresh
        $this->trigger_cache_refresh();
    }
    
    /**
     * Auto-refresh cache on menu update
     */
    public function auto_refresh_cache_on_menu_update() {
        $settings = get_option('headless_cache_settings', array());
        
        if (!empty($settings['auto_refresh_enabled'])) {
            $this->trigger_cache_refresh();
        }
    }
    
    /**
     * Auto-refresh cache on customizer save
     */
    public function auto_refresh_cache_on_customizer_save() {
        $settings = get_option('headless_cache_settings', array());
        
        if (!empty($settings['auto_refresh_enabled'])) {
            $this->trigger_cache_refresh();
        }
    }
    
    /**
     * Admin page callback
     */
    public function admin_page_callback() {
        // Handle form submission
        if (isset($_POST['submit']) && wp_verify_nonce($_POST['cache_settings_nonce'], 'save_cache_settings')) {
            $settings = array(
                'frontend_url' => sanitize_url($_POST['frontend_url']),
                'secret_key' => sanitize_text_field($_POST['secret_key']),
                'auto_refresh_enabled' => isset($_POST['auto_refresh_enabled']) ? 1 : 0
            );
            
            update_option('headless_cache_settings', $settings);
            echo '<div class="notice notice-success"><p>Settings saved successfully!</p></div>';
        }
        
        $settings = get_option('headless_cache_settings', array(
            'frontend_url' => 'http://localhost:3000',
            'secret_key' => '8f7e6d5c4b3a2190fedcba0987654321',
            'auto_refresh_enabled' => 0
        ));
        
        $last_refresh = get_option('headless_cache_last_refresh');
        
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <div class="cache-status"></div>
            
            <div class="card" style="max-width: 800px;">
                <h2>Cache Refresh</h2>
                <p>Manually refresh your Next.js frontend cache to reflect the latest WordPress content changes.</p>
                
                <div style="margin: 20px 0;">
                    <button type="button" class="button button-primary button-large refresh-cache-btn">
                        🔄 Refresh Next.js Cache
                    </button>
                </div>
                
                <?php if ($last_refresh): ?>
                    <p><strong>Last refresh:</strong> <?php echo esc_html(get_date_from_gmt($last_refresh, 'F j, Y g:i a')); ?></p>
                <?php endif; ?>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>Cache Settings</h2>
                
                <form method="post" action="">
                    <?php wp_nonce_field('save_cache_settings', 'cache_settings_nonce'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="frontend_url">Frontend URL</label>
                            </th>
                            <td>
                                <input type="url" id="frontend_url" name="frontend_url" 
                                       value="<?php echo esc_attr($settings['frontend_url']); ?>" 
                                       class="regular-text" placeholder="http://localhost:3000" />
                                <p class="description">The URL of your Next.js frontend application.</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">
                                <label for="secret_key">Secret Key</label>
                            </th>
                            <td>
                                <input type="text" id="secret_key" name="secret_key" 
                                       value="<?php echo esc_attr($settings['secret_key']); ?>" 
                                       class="regular-text" />
                                <p class="description">The secret key used to authenticate cache refresh requests.</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">Auto Refresh</th>
                            <td>
                                <fieldset>
                                    <label for="auto_refresh_enabled">
                                        <input type="checkbox" id="auto_refresh_enabled" name="auto_refresh_enabled" 
                                               value="1" <?php checked($settings['auto_refresh_enabled'], 1); ?> />
                                        Automatically refresh cache when content is updated
                                    </label>
                                    <p class="description">
                                        When enabled, the cache will be automatically refreshed when posts, pages, 
                                        menus, or customizer settings are updated.
                                    </p>
                                </fieldset>
                            </td>
                        </tr>
                    </table>
                    
                    <?php submit_button(); ?>
                </form>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>API Information</h2>
                <p>The cache refresh API endpoint that will be called:</p>
                <code style="background: #f1f1f1; padding: 10px; display: block; margin: 10px 0;">
                    <?php echo esc_html($settings['frontend_url']); ?>/api/cache/init?secret=<?php echo esc_html($settings['secret_key']); ?>
                </code>
                
                <h3>Quick Access</h3>
                <p>You can also refresh the cache quickly from the WordPress admin bar using the "Refresh Cache" button.</p>
            </div>
        </div>
        
        <style>
        .refresh-cache-btn {
            transition: all 0.3s ease;
        }
        .refresh-cache-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        </style>
        <?php
    }
}

// Handle AJAX for auto-refresh toggle
add_action('wp_ajax_toggle_auto_refresh', function() {
    if (!wp_verify_nonce($_POST['nonce'], 'toggle_auto_refresh_nonce')) {
        wp_die('Security check failed');
    }
    
    if (!current_user_can('manage_options')) {
        wp_die('Insufficient permissions');
    }
    
    $settings = get_option('headless_cache_settings', array());
    $settings['auto_refresh_enabled'] = intval($_POST['enabled']);
    update_option('headless_cache_settings', $settings);
    
    wp_die();
});

// Initialize the cache admin handler
new HeadlessCacheAdminHandler();