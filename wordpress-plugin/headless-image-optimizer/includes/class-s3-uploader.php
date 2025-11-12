<?php
/**
 * S3 Uploader Class
 * Handles uploading images to AWS S3
 */

if (!defined('ABSPATH')) {
    exit;
}

class HIO_S3_Uploader {
    
    private $bucket;
    private $region;
    private $path;
    private $access_key;
    private $secret_key;
    
    public function __construct() {
        $this->bucket = get_option('hio_s3_bucket', 'headlessproject');
        $this->region = get_option('hio_s3_region', 'ap-south-1');
        $this->path = get_option('hio_s3_path', 'test/');
        $this->access_key = get_option('hio_aws_access_key', '');
        $this->secret_key = get_option('hio_aws_secret_key', '');
    }
    
    /**
     * Upload file to S3
     */
    public function upload($file_path, $attachment_id, $size = 'full') {
        if (!file_exists($file_path)) {
            return false;
        }
        
        // Get file info
        $file_name = basename($file_path);
        $file_type = mime_content_type($file_path);
        
        // Generate S3 key
        $s3_key = $this->generate_s3_key($file_name, $attachment_id, $size);
        
        // Upload to S3
        $s3_url = $this->upload_to_s3($file_path, $s3_key, $file_type);
        
        if ($s3_url) {
            // Log success
            error_log("HIO: Successfully uploaded {$file_name} to S3: {$s3_url}");
            return $s3_url;
        }
        
        return false;
    }
    
    /**
     * Delete file from S3
     */
    public function delete($attachment_id) {
        $s3_url = get_post_meta($attachment_id, '_s3_url', true);
        
        if (!$s3_url) {
            return false;
        }
        
        // Extract key from URL
        $s3_key = $this->extract_key_from_url($s3_url);
        
        if ($s3_key) {
            $this->delete_from_s3($s3_key);
            
            // Delete all sizes
            $metadata = wp_get_attachment_metadata($attachment_id);
            if (isset($metadata['sizes']) && is_array($metadata['sizes'])) {
                foreach ($metadata['sizes'] as $size => $size_data) {
                    if (isset($size_data['s3_url'])) {
                        $size_key = $this->extract_key_from_url($size_data['s3_url']);
                        if ($size_key) {
                            $this->delete_from_s3($size_key);
                        }
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Generate S3 key for file
     */
    private function generate_s3_key($file_name, $attachment_id, $size = 'full') {
        $upload_dir = wp_upload_dir();
        $date_path = date('Y/m');
        
        // Clean filename
        $file_name = sanitize_file_name($file_name);
        
        // Add size suffix if not full
        if ($size !== 'full') {
            $file_parts = pathinfo($file_name);
            $file_name = $file_parts['filename'] . '-' . $size . '.' . $file_parts['extension'];
        }
        
        // Build S3 key
        $s3_key = $this->path . $date_path . '/' . $file_name;
        
        return $s3_key;
    }
    
    /**
     * Upload file to S3 using AWS SDK or cURL
     */
    private function upload_to_s3($file_path, $s3_key, $content_type) {
        // Check if AWS SDK is available
        if (class_exists('Aws\S3\S3Client')) {
            return $this->upload_with_sdk($file_path, $s3_key, $content_type);
        } else {
            return $this->upload_with_curl($file_path, $s3_key, $content_type);
        }
    }
    
    /**
     * Upload using AWS SDK (if available)
     */
    private function upload_with_sdk($file_path, $s3_key, $content_type) {
        try {
            require_once HIO_PLUGIN_DIR . 'vendor/autoload.php';
            
            $s3Client = new Aws\S3\S3Client([
                'version' => 'latest',
                'region' => $this->region,
                'credentials' => [
                    'key' => $this->access_key,
                    'secret' => $this->secret_key,
                ],
            ]);
            
            $result = $s3Client->putObject([
                'Bucket' => $this->bucket,
                'Key' => $s3_key,
                'SourceFile' => $file_path,
                'ContentType' => $content_type,
                'CacheControl' => 'max-age=31536000',
            ]);
            
            return $result['ObjectURL'];
        } catch (Exception $e) {
            error_log('HIO S3 Upload Error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Upload using cURL with AWS Signature V4
     */
    private function upload_with_curl($file_path, $s3_key, $content_type) {
        if (empty($this->access_key) || empty($this->secret_key)) {
            error_log('HIO: AWS credentials not configured');
            return false;
        }
        
        $file_content = file_get_contents($file_path);
        $file_size = filesize($file_path);
        
        // Build S3 URL
        $host = "{$this->bucket}.s3.{$this->region}.amazonaws.com";
        $url = "https://{$host}/{$s3_key}";
        
        // Generate AWS Signature V4
        $timestamp = gmdate('Ymd\THis\Z');
        $date = gmdate('Ymd');
        
        $headers = [
            'Host' => $host,
            'Content-Type' => $content_type,
            'Content-Length' => $file_size,
            'x-amz-content-sha256' => hash('sha256', $file_content),
            'x-amz-date' => $timestamp,
        ];
        
        $signature = $this->generate_aws_signature('PUT', $s3_key, $headers, $file_content, $date, $timestamp);
        
        $authorization = "AWS4-HMAC-SHA256 Credential={$this->access_key}/{$date}/{$this->region}/s3/aws4_request, SignedHeaders=" . implode(';', array_map('strtolower', array_keys($headers))) . ", Signature={$signature}";
        
        // Prepare cURL headers
        $curl_headers = [
            "Authorization: {$authorization}",
            "Content-Type: {$content_type}",
            "Content-Length: {$file_size}",
            "x-amz-content-sha256: " . hash('sha256', $file_content),
            "x-amz-date: {$timestamp}",
        ];
        
        // Upload via cURL
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $file_content);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $curl_headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($http_code === 200) {
            return $url;
        } else {
            error_log("HIO S3 Upload Error: HTTP {$http_code} - {$error} - Response: {$response}");
            return false;
        }
    }
    
    /**
     * Generate AWS Signature V4
     */
    private function generate_aws_signature($method, $uri, $headers, $payload, $date, $timestamp) {
        $canonical_uri = '/' . $uri;
        $canonical_querystring = '';
        
        // Canonical headers
        ksort($headers);
        $canonical_headers = '';
        $signed_headers = [];
        foreach ($headers as $key => $value) {
            $canonical_headers .= strtolower($key) . ':' . trim($value) . "\n";
            $signed_headers[] = strtolower($key);
        }
        $signed_headers_str = implode(';', $signed_headers);
        
        // Payload hash
        $payload_hash = hash('sha256', $payload);
        
        // Canonical request
        $canonical_request = "{$method}\n{$canonical_uri}\n{$canonical_querystring}\n{$canonical_headers}\n{$signed_headers_str}\n{$payload_hash}";
        
        // String to sign
        $algorithm = 'AWS4-HMAC-SHA256';
        $credential_scope = "{$date}/{$this->region}/s3/aws4_request";
        $string_to_sign = "{$algorithm}\n{$timestamp}\n{$credential_scope}\n" . hash('sha256', $canonical_request);
        
        // Signing key
        $k_date = hash_hmac('sha256', $date, 'AWS4' . $this->secret_key, true);
        $k_region = hash_hmac('sha256', $this->region, $k_date, true);
        $k_service = hash_hmac('sha256', 's3', $k_region, true);
        $k_signing = hash_hmac('sha256', 'aws4_request', $k_service, true);
        
        // Signature
        $signature = hash_hmac('sha256', $string_to_sign, $k_signing);
        
        return $signature;
    }
    
    /**
     * Delete file from S3
     */
    private function delete_from_s3($s3_key) {
        if (class_exists('Aws\S3\S3Client')) {
            return $this->delete_with_sdk($s3_key);
        } else {
            return $this->delete_with_curl($s3_key);
        }
    }
    
    /**
     * Delete using AWS SDK
     */
    private function delete_with_sdk($s3_key) {
        try {
            require_once HIO_PLUGIN_DIR . 'vendor/autoload.php';
            
            $s3Client = new Aws\S3\S3Client([
                'version' => 'latest',
                'region' => $this->region,
                'credentials' => [
                    'key' => $this->access_key,
                    'secret' => $this->secret_key,
                ],
            ]);
            
            $s3Client->deleteObject([
                'Bucket' => $this->bucket,
                'Key' => $s3_key,
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log('HIO S3 Delete Error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete using cURL
     */
    private function delete_with_curl($s3_key) {
        if (empty($this->access_key) || empty($this->secret_key)) {
            return false;
        }
        
        $host = "{$this->bucket}.s3.{$this->region}.amazonaws.com";
        $url = "https://{$host}/{$s3_key}";
        
        $timestamp = gmdate('Ymd\THis\Z');
        $date = gmdate('Ymd');
        
        $headers = [
            'Host' => $host,
            'x-amz-content-sha256' => hash('sha256', ''),
            'x-amz-date' => $timestamp,
        ];
        
        $signature = $this->generate_aws_signature('DELETE', $s3_key, $headers, '', $date, $timestamp);
        
        $authorization = "AWS4-HMAC-SHA256 Credential={$this->access_key}/{$date}/{$this->region}/s3/aws4_request, SignedHeaders=" . implode(';', array_map('strtolower', array_keys($headers))) . ", Signature={$signature}";
        
        $curl_headers = [
            "Authorization: {$authorization}",
            "x-amz-content-sha256: " . hash('sha256', ''),
            "x-amz-date: {$timestamp}",
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $curl_headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $http_code === 204;
    }
    
    /**
     * Extract S3 key from URL
     */
    private function extract_key_from_url($url) {
        $parsed = parse_url($url);
        if (isset($parsed['path'])) {
            return ltrim($parsed['path'], '/');
        }
        return false;
    }
}
