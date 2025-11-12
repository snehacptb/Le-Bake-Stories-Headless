<?php
/**
 * Image Optimizer Class
 * Handles image optimization (resize, compress, format conversion)
 */

if (!defined('ABSPATH')) {
    exit;
}

class HIO_Image_Optimizer {
    
    private $quality;
    private $max_width;
    private $max_height;
    private $auto_optimize;
    
    public function __construct() {
        $this->quality = get_option('hio_image_quality', 85);
        $this->max_width = get_option('hio_max_width', 2048);
        $this->max_height = get_option('hio_max_height', 2048);
        $this->auto_optimize = get_option('hio_auto_optimize', '1');
    }
    
    /**
     * Optimize image
     */
    public function optimize($file_path) {
        // Check if GD library is available
        if (!$this->is_gd_available()) {
            error_log('HIO: PHP GD library is not installed. Image optimization skipped.');
            return false;
        }
        
        if (!$this->auto_optimize || !file_exists($file_path)) {
            return false;
        }
        
        $image_info = getimagesize($file_path);
        if (!$image_info) {
            return false;
        }
        
        list($width, $height, $type) = $image_info;
        
        // Check if optimization is needed
        if ($width <= $this->max_width && $height <= $this->max_height) {
            // Still compress even if size is OK
            return $this->compress_image($file_path, $type);
        }
        
        // Resize and compress
        return $this->resize_and_compress($file_path, $width, $height, $type);
    }
    
    /**
     * Check if GD library is available
     */
    private function is_gd_available() {
        return extension_loaded('gd') && function_exists('gd_info');
    }
    
    /**
     * Resize and compress image
     */
    private function resize_and_compress($file_path, $width, $height, $type) {
        // Calculate new dimensions
        $ratio = min($this->max_width / $width, $this->max_height / $height);
        
        if ($ratio >= 1) {
            // No resize needed, just compress
            return $this->compress_image($file_path, $type);
        }
        
        $new_width = round($width * $ratio);
        $new_height = round($height * $ratio);
        
        // Create image resource
        $source = $this->create_image_resource($file_path, $type);
        if (!$source) {
            return false;
        }
        
        // Create new image
        $destination = imagecreatetruecolor($new_width, $new_height);
        
        // Preserve transparency for PNG and GIF
        if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_GIF) {
            imagealphablending($destination, false);
            imagesavealpha($destination, true);
            $transparent = imagecolorallocatealpha($destination, 255, 255, 255, 127);
            imagefilledrectangle($destination, 0, 0, $new_width, $new_height, $transparent);
        }
        
        // Resize
        imagecopyresampled($destination, $source, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
        
        // Save optimized image
        $result = $this->save_image($destination, $file_path, $type);
        
        // Free memory
        imagedestroy($source);
        imagedestroy($destination);
        
        return $result ? $file_path : false;
    }
    
    /**
     * Compress image without resizing
     */
    private function compress_image($file_path, $type) {
        $source = $this->create_image_resource($file_path, $type);
        if (!$source) {
            return false;
        }
        
        $result = $this->save_image($source, $file_path, $type);
        
        imagedestroy($source);
        
        return $result ? $file_path : false;
    }
    
    /**
     * Create image resource from file
     */
    private function create_image_resource($file_path, $type) {
        switch ($type) {
            case IMAGETYPE_JPEG:
                return imagecreatefromjpeg($file_path);
            case IMAGETYPE_PNG:
                return imagecreatefrompng($file_path);
            case IMAGETYPE_GIF:
                return imagecreatefromgif($file_path);
            case IMAGETYPE_WEBP:
                if (function_exists('imagecreatefromwebp')) {
                    return imagecreatefromwebp($file_path);
                }
                break;
        }
        return false;
    }
    
    /**
     * Save image to file
     */
    private function save_image($resource, $file_path, $type) {
        switch ($type) {
            case IMAGETYPE_JPEG:
                return imagejpeg($resource, $file_path, $this->quality);
            case IMAGETYPE_PNG:
                // PNG compression level (0-9)
                $png_quality = round(9 - ($this->quality / 100 * 9));
                return imagepng($resource, $file_path, $png_quality);
            case IMAGETYPE_GIF:
                return imagegif($resource, $file_path);
            case IMAGETYPE_WEBP:
                if (function_exists('imagewebp')) {
                    return imagewebp($resource, $file_path, $this->quality);
                }
                break;
        }
        return false;
    }
    
    /**
     * Convert image to WebP format
     */
    public function convert_to_webp($file_path) {
        if (!function_exists('imagewebp')) {
            return false;
        }
        
        $image_info = getimagesize($file_path);
        if (!$image_info) {
            return false;
        }
        
        list($width, $height, $type) = $image_info;
        
        $source = $this->create_image_resource($file_path, $type);
        if (!$source) {
            return false;
        }
        
        // Create WebP filename
        $webp_path = preg_replace('/\.(jpg|jpeg|png|gif)$/i', '.webp', $file_path);
        
        // Save as WebP
        $result = imagewebp($source, $webp_path, $this->quality);
        
        imagedestroy($source);
        
        return $result ? $webp_path : false;
    }
    
    /**
     * Get optimized file size
     */
    public function get_file_size($file_path) {
        if (file_exists($file_path)) {
            return filesize($file_path);
        }
        return 0;
    }
    
    /**
     * Calculate compression ratio
     */
    public function calculate_compression_ratio($original_size, $optimized_size) {
        if ($original_size == 0) {
            return 0;
        }
        
        $saved = $original_size - $optimized_size;
        $ratio = ($saved / $original_size) * 100;
        
        return round($ratio, 2);
    }
    
    /**
     * Format file size for display
     */
    public function format_file_size($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
