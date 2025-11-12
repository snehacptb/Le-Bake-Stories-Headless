# Headless Image Optimizer

WordPress plugin that automatically optimizes images and uploads them to AWS S3 with CloudFront CDN.

## Features

- **Automatic**: Upload images → They're optimized and on CDN
- **Fast**: Serve images from CloudFront globally
- **Simple**: Just add AWS credentials and go
- **REST API**: Get CDN URLs for headless frontends
- **Batch Processing**: Optimize existing images

## Installation

1. Upload the `headless-image-optimizer` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > Image Optimizer to configure

## Configuration

### AWS S3 Settings

Your S3 bucket details:
- **S3 Bucket**: `headlessproject`
- **S3 Region**: `ap-south-1`
- **S3 Path**: `test/`
- **S3 URL**: `https://headlessproject.s3.ap-south-1.amazonaws.com/test/`

### CloudFront CDN

- **CDN Domain**: `dejc10dlc5sdq.cloudfront.net`

### Required AWS Permissions

Your IAM user needs the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::headlessproject/test/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::headlessproject"
    }
  ]
}
```

## Usage

### Automatic
Upload any image → It's automatically optimized and on CDN. That's it.

### REST API

Get CDN URL for any image:
```bash
GET /wp-json/image-optimizer/v1/get-url/{id}
```

Response:
```json
{
  "success": true,
  "cdn_url": "https://dejc10dlc5sdq.cloudfront.net/test/2024/01/image.jpg"
}
```

## Settings

- **Image Quality**: 85 (recommended)
- **Max Size**: 2048x2048 pixels
- **Auto Optimize**: Enabled by default

## How It Works

1. **Upload**: User uploads an image to WordPress
2. **Optimize**: Plugin resizes and compresses the image
3. **Upload to S3**: Optimized image is uploaded to your S3 bucket
4. **CDN URL**: CloudFront CDN URL is generated and stored
5. **Serve**: All image requests use the CDN URL automatically

## Frontend Integration

```javascript
// Get CDN URL
const res = await fetch(`/wp-json/image-optimizer/v1/get-url/${imageId}`);
const { cdn_url } = await res.json();

// Use in your app
<img src={cdn_url} alt="Image" />
```

## Troubleshooting

**S3 upload fails?** Check AWS credentials and IAM permissions

**CDN not working?** Verify CloudFront distribution is deployed

**Images not optimizing?** Install PHP GD library: `php -m | grep gd`

## Requirements

- WordPress 5.8 or higher
- PHP 7.4 or higher
- PHP GD library (for image processing)
- AWS S3 bucket with public read access
- CloudFront distribution (optional but recommended)

## License

GPL v2 or later
