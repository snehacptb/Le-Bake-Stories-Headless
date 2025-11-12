# Hero Banners

A professional banner management system for headless WordPress with REST API support.

## Features

- ✅ Custom Post Type for Banners
- ✅ Easy-to-use Admin Interface
- ✅ Multiple Banner Support with Ordering
- ✅ Active/Inactive Status Control
- ✅ RESTful API Endpoints
- ✅ CORS Support for Headless Architecture
- ✅ Image Size Options (Full, Large, Medium, Thumbnail)
- ✅ Dual Button Support
- ✅ Perfect for Next.js, React, Vue.js, etc.

## Installation

1. Upload the `hero-banners` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to "Hero Banners" in admin menu to add banners

## Usage

### Adding a Banner

1. Go to **Hero Banners > Add New**
2. Add a title (internal use)
3. Set **Featured Image** as the banner background
4. Fill in:
   - Subtitle (e.g., "ELEVATE YOUR STYLE")
   - Main Title (e.g., "Discover timeless luxury...")
   - Button 1 Text & Link
   - Button 2 Text & Link
   - Display Order (1 = first)
   - Status (Active/Inactive)
5. Click **Publish**

### API Endpoints

**Active Banners Only:**
```
GET https://your-site.com/wp-json/hero-banners/v1/active
```

**All Published Banners:**
```
GET https://your-site.com/wp-json/hero-banners/v1/all
```

**WordPress REST API:**
```
GET https://your-site.com/wp-json/wp/v2/banners
```

### Response Format

```json
[
  {
    "id": 1,
    "subtitle": "ELEVATE YOUR STYLE",
    "title": "Discover timeless luxury with our exclusive collections",
    "button1": {
      "text": "VIEW MORE",
      "link": "https://example.com/view-more"
    },
    "button2": {
      "text": "TO SHOP",
      "link": "https://example.com/shop"
    },
    "image": {
      "full": "https://example.com/wp-content/uploads/banner.jpg",
      "large": "https://example.com/wp-content/uploads/banner-1024x576.jpg",
      "medium": "https://example.com/wp-content/uploads/banner-300x169.jpg",
      "thumbnail": "https://example.com/wp-content/uploads/banner-150x150.jpg",
      "alt": "Banner Image"
    },
    "order": 1,
    "status": "active"
  }
]
```

## Next.js Integration

### Install Dependencies
```bash
npm install
```

### Create API Service (`lib/api/banners.ts`)
```typescript
const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export async function getBanners() {
  const response = await fetch(`${API_URL}/hero-banners/v1/active`, {
    next: { revalidate: 3600 }
  });
  return response.json();
}
```

### Use in Page
```typescript
import { getBanners } from '@/lib/api/banners';
import BannerComponent from '@/components/Banner';

export default async function HomePage() {
  const banners = await getBanners();
  
  return <BannerComponent banners={banners} />;
}
```

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json
```

## Requirements

- WordPress 5.8+
- PHP 7.4+

## Support

For issues or questions:
- Email: support@finditq.com
- Website: https://finditq.com

## License

GPL v2 or later

## Changelog

### 1.0.0
- Initial release
- Custom Post Type for Banners
- REST API endpoints
- Admin interface
- CORS support

## Credits

Developed by Rashidavc for finditq.com
