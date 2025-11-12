# Changelog

All notable changes to the Hero Banners plugin will be documented in this file.

## [1.0.0] - 2024-11-12

### Added
- Initial release
- Custom Post Type for banners
- Meta boxes for banner content management
- REST API endpoints for headless WordPress
- Admin interface with custom columns
- Active/Inactive status control
- Banner ordering system
- CORS support for headless architectures
- Featured image support with multiple sizes
- Two customizable call-to-action buttons per banner
- Subtitle and main title fields
- Admin styling for better UX

### Features
- `/wp-json/hero-banners/v1/active` - Get only active banners
- `/wp-json/hero-banners/v1/banners` - Get all published banners
- `/wp-json/wp/v2/banners` - WordPress default REST endpoint
- Sortable admin columns (Order, Status)
- Visual status indicators in admin
- Image preview in admin list

### Security
- Nonce verification for meta box saves
- Proper capability checks
- Input sanitization for all fields
- CORS headers for API security
