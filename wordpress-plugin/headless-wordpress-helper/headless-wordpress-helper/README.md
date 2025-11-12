# Headless WordPress Helper Plugin

A comprehensive WordPress plugin that provides CORS support, contact form handling, and WooCommerce Store API integration for headless WordPress sites with Next.js frontends.

## Features

### 🌐 CORS Support
- Configurable allowed origins for cross-origin requests
- WooCommerce Store API compatibility
- Support for credentials and custom headers
- Preflight request handling

### 📧 Contact Form Handler
- REST API endpoint for form submissions
- Email notifications with proper headers
- Form validation and sanitization
- IP address logging

### 🛒 WooCommerce Integration
- Store API nonce handling
- Cart operations support
- Checkout process compatibility

## Installation

1. Upload the entire plugin folder to your WordPress `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure your settings in **Settings > Headless CORS**

## Configuration

### CORS Settings
1. Go to **Settings > Headless CORS** in your WordPress admin
2. Add your frontend URLs to the "Allowed Origins" field (one per line)
3. Configure additional settings as needed

### Contact Form
The contact form endpoint is automatically available at:
```
POST /wp-json/contact-form/v1/submit
```

### Required Form Fields
- `firstName` (string, required)
- `lastName` (string, required) 
- `email` (string, required, validated)
- `subject` (string, required)
- `message` (string, required)
- `phone` (string, optional)

## Usage Examples

### Frontend Integration (Next.js)

```javascript
// Contact form submission
const submitContactForm = async (formData) => {
  try {
    const response = await fetch('https://your-wordpress-site.com/wp-json/contact-form/v1/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Contact form error:', error);
  }
};

// WooCommerce Store API usage
const addToCart = async (productId, quantity = 1) => {
  try {
    const response = await fetch('https://your-wordpress-site.com/wp-json/wc/store/v1/cart/add-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: productId,
        quantity: quantity
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Add to cart error:', error);
  }
};
```

## SMTP Configuration

For reliable email delivery, configure SMTP using one of these plugins:
- **WP Mail SMTP** - Popular and reliable
- **Easy WP SMTP** - Simple configuration
- **Post SMTP** - Advanced features

## Troubleshooting

### CORS Issues
- Ensure your frontend URL is in the allowed origins list
- Check browser developer tools for CORS errors
- Enable debug logging in plugin settings

### Email Issues
- Configure SMTP for reliable delivery
- Test email functionality in plugin settings
- Check WordPress debug.log for errors

### WooCommerce Issues
- Ensure WooCommerce is active
- Try enabling "Disable Store API Nonce Check" option
- Check that Store API is enabled in WooCommerce settings

## Support

For issues and feature requests, please check the plugin settings page for debugging options and test functionality.

## Version History

- **1.2.0** - Combined CORS and contact form functionality into unified plugin
- **1.1.0** - Enhanced CORS support with WooCommerce integration
- **1.0.0** - Initial release with basic CORS and contact form features