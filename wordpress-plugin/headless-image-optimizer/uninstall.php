<?php
/**
 * Uninstall script for Headless Image Optimizer
 * Fired when the plugin is uninstalled
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete plugin options
delete_option('hio_s3_bucket');
delete_option('hio_s3_region');
delete_option('hio_s3_path');
delete_option('hio_cdn_domain');
delete_option('hio_auto_optimize');
delete_option('hio_image_quality');
delete_option('hio_max_width');
delete_option('hio_max_height');
delete_option('hio_aws_access_key');
delete_option('hio_aws_secret_key');
delete_option('hio_use_cdn');
delete_option('hio_convert_to_webp');
delete_option('hio_delete_local_files');
delete_option('hio_backup_originals');

// Optional: Clean up post meta (S3 URLs and CDN URLs)
// Uncomment if you want to remove all S3/CDN metadata on uninstall
/*
global $wpdb;
$wpdb->query("DELETE FROM {$wpdb->postmeta} WHERE meta_key IN ('_s3_url', '_cdn_url')");
*/

// Optional: Delete all optimized images from S3
// This is commented out by default to prevent accidental data loss
/*
if (class_exists('HIO_S3_Uploader')) {
    $s3_uploader = new HIO_S3_Uploader();
    
    $args = [
        'post_type' => 'attachment',
        'post_mime_type' => 'image',
        'posts_per_page' => -1,
        'post_status' => 'any',
        'meta_query' => [
            [
                'key' => '_s3_url',
                'compare' => 'EXISTS'
            ]
        ]
    ];
    
    $attachments = get_posts($args);
    
    foreach ($attachments as $attachment) {
        $s3_uploader->delete($attachment->ID);
    }
}
*/
