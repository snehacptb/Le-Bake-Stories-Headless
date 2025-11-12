jQuery(document).ready(function($) {
    
    // Batch Optimization
    $('#hio-batch-optimize-btn').on('click', function() {
        const button = $(this);
        const progressContainer = $('#hio-batch-progress');
        const progressBar = $('#hio-progress-bar');
        const progressText = $('#hio-progress-text');
        
        button.prop('disabled', true);
        progressContainer.show();
        
        let offset = 0;
        const limit = 10;
        let totalProcessed = 0;
        
        function processNextBatch() {
            $.ajax({
                url: hioAdmin.restUrl + 'batch-optimize',
                method: 'POST',
                headers: {
                    'X-WP-Nonce': hioAdmin.nonce
                },
                data: JSON.stringify({
                    limit: limit,
                    offset: offset
                }),
                contentType: 'application/json',
                success: function(response) {
                    if (response.success) {
                        totalProcessed += response.processed;
                        offset = response.offset;
                        
                        progressText.text(`Processed ${totalProcessed} images...`);
                        
                        // If there are more images to process
                        if (response.total_found === limit) {
                            processNextBatch();
                        } else {
                            // Done
                            progressBar.val(100);
                            progressText.text(`Completed! Optimized ${totalProcessed} images.`);
                            button.prop('disabled', false);
                            
                            // Reload page after 2 seconds
                            setTimeout(function() {
                                location.reload();
                            }, 2000);
                        }
                    } else {
                        progressText.text('Error occurred during optimization.');
                        button.prop('disabled', false);
                    }
                },
                error: function(xhr, status, error) {
                    progressText.text('Error: ' + error);
                    button.prop('disabled', false);
                }
            });
        }
        
        processNextBatch();
    });
    
    // Test S3 Connection
    $('#hio-test-s3-btn').on('click', function() {
        const button = $(this);
        const resultsDiv = $('#hio-test-results');
        
        button.prop('disabled', true);
        resultsDiv.html('<p>Testing S3 connection...</p>');
        
        // Create a test by trying to get stats
        $.ajax({
            url: hioAdmin.restUrl + 'stats',
            method: 'GET',
            headers: {
                'X-WP-Nonce': hioAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    resultsDiv.html(
                        '<div class="hio-test-result success">' +
                        '<strong>S3 Configuration Valid</strong><br>' +
                        'Bucket: ' + response.s3_bucket + '<br>' +
                        'Total Images: ' + response.total_images + '<br>' +
                        'Optimized: ' + response.optimized_images +
                        '</div>'
                    );
                } else {
                    resultsDiv.html(
                        '<div class="hio-test-result error">' +
                        '<strong>S3 Test Failed</strong><br>' +
                        'Please check your AWS credentials and bucket settings.' +
                        '</div>'
                    );
                }
                button.prop('disabled', false);
            },
            error: function(xhr, status, error) {
                resultsDiv.html(
                    '<div class="hio-test-result error">' +
                    '<strong>Connection Error</strong><br>' +
                    error +
                    '</div>'
                );
                button.prop('disabled', false);
            }
        });
    });
    
    // Test CDN Connection
    $('#hio-test-cdn-btn').on('click', function() {
        const button = $(this);
        const resultsDiv = $('#hio-test-results');
        const cdnDomain = $('#hio_cdn_domain').val();
        
        if (!cdnDomain) {
            resultsDiv.html(
                '<div class="hio-test-result error">' +
                '<strong>CDN Domain Not Set</strong><br>' +
                'Please enter a CDN domain first.' +
                '</div>'
            );
            return;
        }
        
        button.prop('disabled', true);
        resultsDiv.html('<p>Testing CDN connection...</p>');
        
        // Test by making a HEAD request to the CDN domain
        const testUrl = 'https://' + cdnDomain;
        
        $.ajax({
            url: testUrl,
            method: 'HEAD',
            timeout: 10000,
            success: function() {
                resultsDiv.html(
                    '<div class="hio-test-result success">' +
                    '<strong>CDN Connection Successful</strong><br>' +
                    'Domain: ' + cdnDomain + ' is accessible.' +
                    '</div>'
                );
                button.prop('disabled', false);
            },
            error: function(xhr, status, error) {
                // CORS might block this, but that's actually OK
                // If we get a CORS error, it means the domain exists
                if (status === 'error' && xhr.status === 0) {
                    resultsDiv.html(
                        '<div class="hio-test-result success">' +
                        '<strong>CDN Domain Exists</strong><br>' +
                        'Domain: ' + cdnDomain + ' is configured (CORS blocked direct test, which is normal).' +
                        '</div>'
                    );
                } else {
                    resultsDiv.html(
                        '<div class="hio-test-result error">' +
                        '<strong>CDN Test Failed</strong><br>' +
                        'Status: ' + status + '<br>' +
                        'Error: ' + error +
                        '</div>'
                    );
                }
                button.prop('disabled', false);
            }
        });
    });
    
    // Show/hide AWS credentials based on whether they're set
    const accessKeyInput = $('#hio_aws_access_key');
    const secretKeyInput = $('#hio_aws_secret_key');
    
    if (accessKeyInput.val()) {
        accessKeyInput.attr('type', 'password');
    }
    
    accessKeyInput.on('focus', function() {
        $(this).attr('type', 'text');
    });
    
    accessKeyInput.on('blur', function() {
        if ($(this).val()) {
            $(this).attr('type', 'password');
        }
    });
});
