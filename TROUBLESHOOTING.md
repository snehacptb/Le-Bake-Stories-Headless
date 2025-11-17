# Elementor Troubleshooting Guide

## Common Errors and Solutions

### ✅ FIXED: TypeError: Cannot read properties of null (reading 'removeChild')

**What it was:** This error occurred when trying to manipulate DOM elements that were no longer available or whose parent nodes were null.

**What was fixed:**
1. Added null checks before all `removeChild` operations
2. Added try-catch blocks around DOM manipulation
3. Added fallback handlers for form initialization
4. Improved cleanup functions in useEffect hooks

**How to verify the fix:**
- Refresh your page
- Check browser console - error should be gone
- Forms and widgets should initialize properly

---

## Other Common Issues

### Issue: Widgets Not Initializing

**Symptoms:**
- Sliders don't slide
- Tabs don't switch
- Forms don't respond

**Solution:**
```javascript
// Check in browser console:
console.log(window.elementorFrontend) // Should not be undefined
console.log(window.Swiper) // Should not be undefined

// Check for error messages in console
```

**Fix:**
1. Clear browser cache
2. Check Network tab - verify JS files are loading
3. Check for JavaScript errors in console

---

### Issue: CSS Not Loading

**Symptoms:**
- Page looks unstyled
- Elements appear broken
- Layout is incorrect

**Solution:**
1. Open Network tab in DevTools
2. Filter by "CSS"
3. Look for failed requests (red status)

**Fix:**
```tsx
// Verify WordPress URL is correct in .env.local
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
```

---

### Issue: Forms Not Submitting

**Symptoms:**
- Submit button doesn't work
- No response when clicking submit
- Console shows errors

**Solution:**
Check these in order:

1. **WordPress URL configured?**
   ```env
   NEXT_PUBLIC_WORDPRESS_URL=https://your-site.com
   ```

2. **CORS headers enabled?**
   WordPress should allow requests from your Next.js domain

3. **admin-ajax.php accessible?**
   Test: `https://your-site.com/wp-admin/admin-ajax.php`

---

### Issue: Animations Not Playing

**Symptoms:**
- Elements don't fade in
- Scroll animations don't trigger
- Content appears static

**Solution:**
1. Check if Intersection Observer is supported:
   ```javascript
   console.log('IntersectionObserver' in window) // Should be true
   ```

2. Check animation classes:
   ```javascript
   // Look for elements with animation data
   document.querySelectorAll('[data-settings*="animation"]')
   ```

---

### Issue: Images Not Loading

**Symptoms:**
- Broken image icons
- Images show alt text only
- Console shows 404 errors

**Solution:**
1. Check image URLs in Network tab
2. Verify WordPress URL is correct
3. Check CORS for images

**Fix:**
The ElementorRenderer automatically fixes image URLs, but verify:
```tsx
// Image URLs should include full WordPress domain
https://your-wordpress-site.com/wp-content/uploads/...
```

---

## Debug Mode

### Enable Detailed Logging

Add to your `.env.local`:
```env
NEXT_PUBLIC_DEBUG_ELEMENTOR=true
```

Then in your code:
```tsx
// In elementor-service.ts or elementor-widgets.ts
if (process.env.NEXT_PUBLIC_DEBUG_ELEMENTOR) {
  console.log('Debug info:', {
    assets,
    widgets,
    settings
  })
}
```

---

## Browser Console Checks

### 1. Check Elementor is Loaded
```javascript
console.log(window.elementorFrontend)
// Should show object with init, hooks, etc.
```

### 2. Check jQuery is Loaded
```javascript
console.log(window.jQuery)
// Should show jQuery function
```

### 3. Check Swiper is Loaded
```javascript
console.log(window.Swiper)
// Should show Swiper constructor
```

### 4. Check for Errors
```javascript
// Open Console tab
// Look for red error messages
// Check Network tab for failed requests
```

---

## Network Tab Analysis

### What to Look For:

1. **CSS Files**
   - Status should be `200` (green)
   - Type: `stylesheet`
   - Should include: `elementor/css/frontend.min.css`

2. **JS Files**
   - Status should be `200` (green)
   - Type: `script`
   - Should include: 
     - `jquery.min.js`
     - `swiper.min.js`
     - `elementor/assets/js/frontend.min.js`

3. **API Calls**
   - `/api/elementor-assets?pageId=XXX`
   - Should return JSON with assets

---

## Quick Fixes

### Fix 1: Clear Cache and Reload
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Fix 2: Clear Browser Cache
1. Open DevTools
2. Right-click Refresh button
3. Choose "Empty Cache and Hard Reload"

### Fix 3: Verify Environment Variables
```bash
# Check .env.local exists
cat .env.local

# Should contain:
NEXT_PUBLIC_WORDPRESS_URL=https://your-site.com
```

### Fix 4: Check WordPress Elementor
1. Log into WordPress admin
2. Go to Elementor → Settings
3. Verify Elementor is active
4. Check page is built with Elementor

---

## Error Messages Guide

### "Failed to fetch Elementor assets"
**Cause:** Can't connect to WordPress
**Fix:** Check `NEXT_PUBLIC_WORDPRESS_URL` in `.env.local`

### "Elementor frontend not available"
**Cause:** JavaScript files didn't load
**Fix:** Check Network tab for failed JS requests

### "Cannot read properties of undefined"
**Cause:** Missing dependency or element
**Fix:** Check if element exists before accessing

### "CORS policy error"
**Cause:** WordPress not allowing your Next.js domain
**Fix:** Add CORS headers to WordPress

---

## WordPress CORS Configuration

Add to WordPress `.htaccess` or server config:

```apache
# Allow Next.js domain
Header set Access-Control-Allow-Origin "https://your-nextjs-site.com"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

Or use a WordPress plugin like "WP CORS" or add to `functions.php`:

```php
add_action('init', function() {
    header("Access-Control-Allow-Origin: https://your-nextjs-site.com");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
});
```

---

## Performance Issues

### Issue: Slow Page Load

**Solutions:**

1. **Enable Asset Caching**
   Assets are automatically cached in memory

2. **Lazy Load Images**
   Images are lazy loaded by default

3. **Minimize Widgets**
   Fewer widgets = faster initialization

4. **Check Network Speed**
   Large JS/CSS files from WordPress may be slow

---

## Testing Your Setup

### Step-by-Step Test:

1. **Open a page with Elementor content**
   ```
   http://localhost:3000/about
   ```

2. **Open DevTools Console**
   - Look for: `✅ Elementor CSS loaded`
   - Look for: `✅ Elementor JS loaded`
   - Look for: `✅ Elementor widgets initialized`

3. **Test Interactions**
   - Click slider arrows
   - Click tabs
   - Fill out a form
   - Scroll to trigger animations

4. **Check Network Tab**
   - All CSS files: Status 200
   - All JS files: Status 200
   - No 404 errors

---

## Still Having Issues?

### Collect This Information:

1. **Error Message** (from Console)
2. **Failed Requests** (from Network tab)
3. **Environment Variables** (sanitized - no sensitive info)
4. **Browser and Version**
5. **Next.js Version**
6. **Page URL**

### Debug Output:

```javascript
// Run this in browser console:
console.log({
  elementorFrontend: typeof window.elementorFrontend,
  jQuery: typeof window.jQuery,
  Swiper: typeof window.Swiper,
  pageId: document.querySelector('[data-elementor-page-id]')?.getAttribute('data-elementor-page-id')
})
```

---

## Prevention Tips

1. **Keep WordPress Updated**
   - Update Elementor plugin regularly
   - Update WordPress core

2. **Test After Changes**
   - Always test after updating WordPress
   - Test after updating Elementor

3. **Monitor Console**
   - Check console for warnings
   - Fix warnings before they become errors

4. **Use Version Control**
   - Commit working code
   - Easy to revert if issues arise

---

## Success Indicators

You'll know everything is working when:

✅ No errors in console  
✅ All CSS files load (Network tab)  
✅ All JS files load (Network tab)  
✅ Widgets are interactive  
✅ Forms submit successfully  
✅ Animations play on scroll  
✅ Images load correctly  
✅ Layout matches WordPress preview  

---

**Last Updated:** November 17, 2025  
**Version:** 2.0.0

