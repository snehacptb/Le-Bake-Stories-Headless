# Installation Guide

## WordPress Plugin Installation

### Method 1: Manual Upload (Recommended)

1. **Download/Prepare the Plugin Files**
   - Ensure you have all the plugin files in the correct structure:
   ```
   headless-wordpress-helper/
   ├── headless-wordpress-helper.php (main plugin file)
   ├── headless-helper-plugin/
   │   ├── headless-cors.php
   │   └── headless-contact-form.php
   └── README.md
   ```

2. **Upload to WordPress**
   - Zip the entire `headless-wordpress-helper` folder
   - Go to your WordPress admin dashboard
   - Navigate to **Plugins > Add New**
   - Click **Upload Plugin**
   - Choose the zip file and click **Install Now**
   - Click **Activate Plugin**

### Method 2: FTP Upload

1. **Upload Files via FTP**
   - Upload the entire plugin folder to `/wp-content/plugins/`
   - The final path should be: `/wp-content/plugins/headless-wordpress-helper/`

2. **Activate the Plugin**
   - Go to **Plugins** in your WordPress admin
   - Find "Headless WordPress Helper" and click **Activate**

## Post-Installation Configuration

1. **Configure CORS Settings**
   - Go to **Settings > Headless CORS**
   - Add your frontend URLs to "Allowed Origins"
   - Example: `http://localhost:3000`, `https://yourdomain.com`

2. **Test the Installation**
   - Use the test email feature in the settings page
   - Check that the contact form endpoint is accessible
   - Verify CORS headers are being sent

## Troubleshooting Installation Issues

### "No valid plugins were found" Error
- Ensure the main plugin file (`headless-wordpress-helper.php`) is in the root of the plugin directory
- Check that the plugin header is properly formatted
- Verify file permissions allow WordPress to read the files

### Plugin Activation Issues
- Check WordPress error logs
- Ensure PHP version is 7.4 or higher
- Verify all required files are present

### CORS Not Working
- Check that your frontend URL is in the allowed origins list
- Clear any caching plugins
- Test with browser developer tools

## File Structure Requirements

The plugin requires this exact file structure:
```
headless-wordpress-helper/
├── headless-wordpress-helper.php    # Main plugin file (REQUIRED)
├── headless-helper-plugin/          # Subdirectory for modules
│   ├── headless-cors.php            # CORS functionality
│   └── headless-contact-form.php    # Contact form functionality
└── README.md                        # Documentation
```

## Support

If you encounter issues during installation:
1. Check the WordPress error logs
2. Verify file permissions
3. Ensure all files are uploaded correctly
4. Test with a fresh WordPress installation if needed