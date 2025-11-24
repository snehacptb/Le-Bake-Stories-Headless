# Hero Banners

A professional banner management system for headless WordPress with REST API support and page-specific banner assignments.

## Features

- ✅ Custom Post Type for Banners
- ✅ Easy-to-use Admin Interface
- ✅ **Page-Specific Banner Display** (NEW)
- ✅ **Multiple Banners Per Page Support** (NEW)
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
   - **Display on Pages** (Select which pages should show this banner)
     - ✅ All Pages
     - ✅ Home Page
     - ✅ Specific Pages (Select from list)
   - Display Order (1 = first, for ordering multiple banners on same page)
   - Status (Active/Inactive)
5. Click **Publish**

### API Endpoints

**Get Banners for a Specific Page (by ID):**
```
GET https://your-site.com/wp-json/hero-banners/v1/page/123
```

**Get Banners for a Specific Page (by slug):**
```
GET https://your-site.com/wp-json/hero-banners/v1/page/about-us
```

**Get Banners for Home Page:**
```
GET https://your-site.com/wp-json/hero-banners/v1/page/home
```

**All Active Banners (regardless of page):**
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
    "status": "active",
    "pages": ["home", "123", "456"]
  }
]
```

**Note:** The `pages` array contains:
- `"all"` - if banner is set to display on all pages
- `"home"` - if banner is set for home page
- Page IDs as strings (e.g., `"123"`) - for specific pages

## Next.js Integration

### Install Dependencies
```bash
npm install
```

### Create API Service (`lib/api/banners.ts`)
```typescript
const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

// Get all active banners
export async function getBanners() {
  const response = await fetch(`${API_URL}/hero-banners/v1/active`, {
    next: { revalidate: 3600 }
  });
  return response.json();
}

// Get banners for a specific page
export async function getBannersByPage(pageIdentifier: string) {
  const response = await fetch(`${API_URL}/hero-banners/v1/page/${pageIdentifier}`, {
    next: { revalidate: 3600 }
  });
  return response.json();
}

// Get banners for home page
export async function getHomeBanners() {
  return getBannersByPage('home');
}
```

### Use in Home Page
```typescript
import { getHomeBanners } from '@/lib/api/banners';
import BannerComponent from '@/components/Banner';

export default async function HomePage() {
  const banners = await getHomeBanners();
  
  return <BannerComponent banners={banners} />;
}
```

### Use in Dynamic Page (by slug)
```typescript
import { getBannersByPage } from '@/lib/api/banners';
import BannerComponent from '@/components/Banner';

interface PageProps {
  params: { slug: string }
}

export default async function Page({ params }: PageProps) {
  const banners = await getBannersByPage(params.slug);
  
  return (
    <div>
      {banners.length > 0 && <BannerComponent banners={banners} />}
      {/* Rest of your page content */}
    </div>
  );
}
```

### Use in Dynamic Page (by ID)
```typescript
import { getBannersByPage } from '@/lib/api/banners';

// If you have the WordPress page ID
const pageId = '123';
const banners = await getBannersByPage(pageId);
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

### 1.1.0
- ✨ **NEW:** Page-specific banner assignments
- ✨ **NEW:** Support for multiple banners per page
- ✨ **NEW:** REST API endpoint to fetch banners by page ID or slug
- ✨ **NEW:** "All Pages" and "Home Page" options
- ✨ **IMPROVED:** Admin interface with page selection checkboxes
- ✨ **IMPROVED:** Admin columns now show which pages banners are assigned to
- ✨ **IMPROVED:** Enhanced API response with page assignment data

### 1.0.0
- Initial release
- Custom Post Type for Banners
- REST API endpoints
- Admin interface
- CORS support

## Credits

Developed by Rashidavc for finditq.com
