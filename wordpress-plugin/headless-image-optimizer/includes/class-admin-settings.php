<?php
/**
 * Admin Settings Class
 * Handles plugin settings page and configuration
 */

if (!defined('ABSPATH')) {
    exit;
}

class HIO_Admin_Settings {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Image Optimizer Settings',
            'Image Optimizer',
            'manage_options',
            'headless-image-optimizer',
            [$this, 'render_settings_page']
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        // AWS S3 Settings
        register_setting('hio_settings', 'hio_aws_access_key');
        register_setting('hio_settings', 'hio_aws_secret_key');
        register_setting('hio_settings', 'hio_s3_bucket');
        register_setting('hio_settings', 'hio_s3_region');
        register_setting('hio_settings', 'hio_s3_path');
        
        // CDN Settings
        register_setting('hio_settings', 'hio_cdn_domain');
        register_setting('hio_settings', 'hio_use_cdn');
        
        // Optimization Settings
        register_setting('hio_settings', 'hio_auto_optimize');
        register_setting('hio_settings', 'hio_image_quality');
        register_setting('hio_settings', 'hio_max_width');
        register_setting('hio_settings', 'hio_max_height');
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_headless-image-optimizer') {
            return;
        }
        
        wp_enqueue_style('hio-admin-css', HIO_PLUGIN_URL . 'assets/admin.css', [], HIO_VERSION);
        wp_enqueue_script('hio-admin-js', HIO_PLUGIN_URL . 'assets/admin.js', ['jquery'], HIO_VERSION, true);
        
        wp_localize_script('hio-admin-js', 'hioAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url('image-optimizer/v1/'),
            'nonce' => wp_create_nonce('wp_rest')
        ]);
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Get stats
        global $wpdb;
        $total_images = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%'");
        $optimized_images = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_cdn_url'");
        $pending_images = $total_images - $optimized_images;
        
        // Check GD library status
        $gd_installed = extension_loaded('gd') && function_exists('gd_info');
        
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php if (!$gd_installed): ?>
            <div class="notice notice-error">
                <p>
                    <strong>⚠️ PHP GD Extension Not Found</strong><br>
                    The GD library is required for image optimization. Images will be uploaded to S3 without compression.
                    <br><br>
                    <strong>To enable optimization:</strong> Install the PHP GD extension on your server.
                    <a href="<?php echo HIO_PLUGIN_URL . 'GD_INSTALLATION.md'; ?>" target="_blank">View installation instructions</a>
                </p>
            </div>
            <?php endif; ?>
            
            <div class="hio-stats-cards">
                <div class="hio-stat-card">
                    <h3>Total Images</h3>
                    <p class="hio-stat-number"><?php echo esc_html($total_images); ?></p>
                </div>
                <div class="hio-stat-card">
                    <h3>Optimized</h3>
                    <p class="hio-stat-number"><?php echo esc_html($optimized_images); ?></p>
                </div>
                <div class="hio-stat-card">
                    <h3>Pending</h3>
                    <p class="hio-stat-number"><?php echo esc_html($pending_images); ?></p>
                </div>
            </div>
            
            <?php if ($pending_images > 0): ?>
            <div class="hio-batch-optimize">
                <h2>Batch Optimization</h2>
                <p>Optimize all existing images and upload them to S3/CDN.</p>
                <button type="button" id="hio-batch-optimize-btn" class="button button-primary">
                    Start Batch Optimization
                </button>
                <div id="hio-batch-progress" style="display:none;">
                    <progress id="hio-progress-bar" max="100" value="0"></progress>
                    <p id="hio-progress-text">Processing...</p>
                </div>
            </div>
            <?php endif; ?>
            
            <form action="options.php" method="post">
                <?php
                settings_fields('hio_settings');
                ?>
                
                <h2 class="title">AWS S3 Settings</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="hio_aws_access_key">AWS Access Key</label>
                        </th>
                        <td>
                            <input type="text" id="hio_aws_access_key" name="hio_aws_access_key" 
                                   value="<?php echo esc_attr(get_option('hio_aws_access_key')); ?>" 
                                   class="regular-text" />
                            <p class="description">Your AWS IAM access key with S3 permissions</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_aws_secret_key">AWS Secret Key</label>
                        </th>
                        <td>
                            <input type="password" id="hio_aws_secret_key" name="hio_aws_secret_key" 
                                   value="<?php echo esc_attr(get_option('hio_aws_secret_key')); ?>" 
                                   class="regular-text" />
                            <p class="description">Your AWS IAM secret key</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_s3_bucket">S3 Bucket Name</label>
                        </th>
                        <td>
                            <input type="text" id="hio_s3_bucket" name="hio_s3_bucket" 
                                   value="<?php echo esc_attr(get_option('hio_s3_bucket', 'headlessproject')); ?>" 
                                   class="regular-text" />
                            <p class="description">Example: headlessproject</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_s3_region">S3 Region</label>
                        </th>
                        <td>
                            <input type="text" id="hio_s3_region" name="hio_s3_region" 
                                   value="<?php echo esc_attr(get_option('hio_s3_region', 'ap-south-1')); ?>" 
                                   class="regular-text" />
                            <p class="description">Example: ap-south-1</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_s3_path">S3 Path Prefix</label>
                        </th>
                        <td>
                            <input type="text" id="hio_s3_path" name="hio_s3_path" 
                                   value="<?php echo esc_attr(get_option('hio_s3_path', 'test/')); ?>" 
                                   class="regular-text" />
                            <p class="description">Example: test/ (leave empty for root)</p>
                        </td>
                    </tr>
                </table>
                
                <h2 class="title">CDN Settings</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="hio_use_cdn">Enable CDN</label>
                        </th>
                        <td>
                            <input type="checkbox" id="hio_use_cdn" name="hio_use_cdn" value="1" 
                                   <?php checked(get_option('hio_use_cdn', '1'), '1'); ?> />
                            <label for="hio_use_cdn">Use CloudFront CDN for serving images</label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_cdn_domain">CDN Domain</label>
                        </th>
                        <td>
                            <input type="text" id="hio_cdn_domain" name="hio_cdn_domain" 
                                   value="<?php echo esc_attr(get_option('hio_cdn_domain', 'dejc10dlc5sdq.cloudfront.net')); ?>" 
                                   class="regular-text" />
                            <p class="description">Your CloudFront distribution domain (without https://)</p>
                        </td>
                    </tr>
                </table>
                
                <h2 class="title">Optimization Settings</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="hio_auto_optimize">Auto Optimize</label>
                        </th>
                        <td>
                            <input type="checkbox" id="hio_auto_optimize" name="hio_auto_optimize" value="1" 
                                   <?php checked(get_option('hio_auto_optimize', '1'), '1'); ?> />
                            <label for="hio_auto_optimize">Automatically optimize and upload images</label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_image_quality">Image Quality</label>
                        </th>
                        <td>
                            <input type="number" id="hio_image_quality" name="hio_image_quality" 
                                   value="<?php echo esc_attr(get_option('hio_image_quality', '85')); ?>" 
                                   min="1" max="100" class="small-text" />
                            <p class="description">1-100 (Recommended: 85)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_max_width">Max Width</label>
                        </th>
                        <td>
                            <input type="number" id="hio_max_width" name="hio_max_width" 
                                   value="<?php echo esc_attr(get_option('hio_max_width', '2048')); ?>" 
                                   min="100" class="small-text" /> px
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="hio_max_height">Max Height</label>
                        </th>
                        <td>
                            <input type="number" id="hio_max_height" name="hio_max_height" 
                                   value="<?php echo esc_attr(get_option('hio_max_height', '2048')); ?>" 
                                   min="100" class="small-text" /> px
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('Save Settings'); ?>
            </form>
            
            <div class="hio-test-connection">
                <h2>Test Connection</h2>
                <button type="button" id="hio-test-s3-btn" class="button">Test S3 Connection</button>
                <button type="button" id="hio-test-cdn-btn" class="button">Test CDN Connection</button>
                <div id="hio-test-results"></div>
            </div>
        </div>
        
        <style>
            .hio-stats-cards {
                display: flex;
                gap: 20px;
                margin: 20px 0;
            }
            .hio-stat-card {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                flex: 1;
                text-align: center;
            }
            .hio-stat-card h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
            }
            .hio-stat-number {
                font-size: 32px;
                font-weight: bold;
                margin: 0;
                color: #2271b1;
            }
            .hio-batch-optimize {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                margin: 20px 0;
            }
            .hio-batch-optimize h2 {
                margin-top: 0;
            }
            #hio-progress-bar {
                width: 100%;
                height: 30px;
                margin: 10px 0;
            }
            .hio-test-connection {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                margin: 20px 0;
            }
            #hio-test-results {
                margin-top: 15px;
            }
            .hio-test-result {
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
            }
            .hio-test-result.success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            .hio-test-result.error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }
        </style>
        <?php
    }
}
