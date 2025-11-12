<?php
/**
 * CDN Manager Class
 * Handles CloudFront CDN URL generation and management
 */

if (!defined('ABSPATH')) {
    exit;
}

class HIO_CDN_Manager {
    
    private $cdn_domain;
    private $use_cdn;
    
    public function __construct() {
        $this->cdn_domain = get_option('hio_cdn_domain', 'dejc10dlc5sdq.cloudfront.net');
        $this->use_cdn = get_option('hio_use_cdn', '1');
    }
    
    /**
     * Convert S3 URL to CDN URL
     */
    public function get_cdn_url($s3_url) {
        if (!$this->use_cdn || empty($this->cdn_domain)) {
            return $s3_url;
        }
        
        // Parse S3 URL
        $parsed = parse_url($s3_url);
        
        if (!isset($parsed['path'])) {
            return $s3_url;
        }
        
        // Build CDN URL
        $cdn_url = 'https://' . $this->cdn_domain . $parsed['path'];
        
        return $cdn_url;
    }
    
    /**
     * Get responsive image URLs
     */
    public function get_responsive_urls($attachment_id) {
        $urls = [];
        
        // Get full size CDN URL
        $cdn_url = get_post_meta($attachment_id, '_cdn_url', true);
        if ($cdn_url) {
            $urls['full'] = $cdn_url;
        }
        
        // Get all image sizes
        $metadata = wp_get_attachment_metadata($attachment_id);
        
        if (isset($metadata['sizes']) && is_array($metadata['sizes'])) {
            foreach ($metadata['sizes'] as $size => $size_data) {
                if (isset($size_data['cdn_url'])) {
                    $urls[$size] = $size_data['cdn_url'];
                }
            }
        }
        
        return $urls;
    }
    
    /**
     * Generate srcset attribute for responsive images
     */
    public function generate_srcset($attachment_id) {
        $urls = $this->get_responsive_urls($attachment_id);
        $metadata = wp_get_attachment_metadata($attachment_id);
        
        if (empty($urls) || !$metadata) {
            return '';
        }
        
        $srcset = [];
        
        foreach ($urls as $size => $url) {
            if ($size === 'full') {
                $width = isset($metadata['width']) ? $metadata['width'] : 0;
            } else {
                $width = isset($metadata['sizes'][$size]['width']) ? $metadata['sizes'][$size]['width'] : 0;
            }
            
            if ($width > 0) {
                $srcset[] = $url . ' ' . $width . 'w';
            }
        }
        
        return implode(', ', $srcset);
    }
    
    /**
     * Invalidate CDN cache for specific files
     */
    public function invalidate_cache($paths) {
        // This would require AWS SDK and CloudFront client
        // For now, we'll log the invalidation request
        
        if (!is_array($paths)) {
            $paths = [$paths];
        }
        
        error_log('HIO: CDN cache invalidation requested for: ' . implode(', ', $paths));
        
        // TODO: Implement actual CloudFront invalidation
        // This requires AWS SDK and additional permissions
        
        return true;
    }
    
    /**
     * Get CDN statistics
     */
    public function get_stats() {
        global $wpdb;
        
        $total_cdn_images = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_cdn_url'");
        
        return [
            'total_cdn_images' => intval($total_cdn_images),
            'cdn_domain' => $this->cdn_domain,
            'cdn_enabled' => $this->use_cdn === '1',
        ];
    }
    
    /**
     * Test CDN connectivity
     */
    public function test_cdn_connection() {
        if (empty($this->cdn_domain)) {
            return [
                'success' => false,
                'message' => 'CDN domain not configured'
            ];
        }
        
        $test_url = 'https://' . $this->cdn_domain;
        
        $response = wp_remote_head($test_url, [
            'timeout' => 10,
            'sslverify' => true
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message()
            ];
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code >= 200 && $status_code < 500) {
            return [
                'success' => true,
                'message' => 'CDN is accessible',
                'status_code' => $status_code
            ];
        }
        
        return [
            'success' => false,
            'message' => 'CDN returned status code: ' . $status_code,
            'status_code' => $status_code
        ];
    }
}
