# Troubleshooting Guide

Common issues and solutions for Le Bake Stories headless WordPress site.

---

## Hydration Errors

### Issue: "TypeError: Cannot read properties of null (reading 'removeChild')"

**Symptoms:**
- Runtime error when opening the site
- Console shows: `TypeError: Cannot read properties of null (reading 'removeChild')`
- Error related to hydration mismatch

**Cause:**
This error occurs when components that use client-side only features (like DOM manipulation, localStorage, or browser APIs) render differently on the server vs. client, causing a hydration mismatch.

**Solution:**
The floating admin SEO panel components needed client-side only rendering. Fixed by:

1. **Added `isMounted` state** to both components:
   - `src/components/admin/admin-panel-wrapper.tsx`
   - `src/components/admin/floating-seo-panel.tsx`

2. **Return `null` during server-side render:**
```typescript
const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
  setIsMounted(true)
}, [])

if (!isMounted) {
  return null
}
```

3. **Ensure hooks only run after mount:**
```typescript
useEffect(() => {
  if (!isMounted) return
  // client-side code here
}, [isMounted, ...otherDeps])
```

**Status:** ✅ Fixed

---

## SEO Panel Issues

### Panel Not Showing

**Issue:** Floating SEO button doesn't appear

**Checklist:**
- [ ] Logged in as admin/editor
- [ ] JWT token exists in localStorage
- [ ] JWT plugin active in WordPress
- [ ] CORS configured correctly
- [ ] No console errors

**Debug:**
```javascript
// Check in browser console
console.log('Token:', localStorage.getItem('wc-auth-token'))
console.log('User ID:', localStorage.getItem('wc-user-id'))
```

---

### Authentication Errors

**Issue:** "No authorization token provided"

**Solutions:**
1. Re-login to refresh JWT token
2. Check `wp-config.php` has JWT secret
3. Verify `.htaccess` Authorization header config
4. Check CORS headers

---

## WooCommerce Issues

### Cart Not Working

**Issue:** Products not adding to cart

**Check:**
1. WooCommerce API keys configured
2. CORS enabled for your domain
3. Check browser console for API errors
4. Verify cart context is wrapped around components

---

### Checkout Errors

**Issue:** Order not completing

**Check:**
1. Payment gateway credentials configured
2. Webhook URLs set up (for Stripe)
3. SSL certificate active (HTTPS required)
4. Check WordPress error logs

---

## Performance Issues

### Slow Page Load

**Solutions:**
1. Enable caching: `npm run cache:refresh`
2. Check CDN configuration (CloudFront/Cloudflare)
3. Optimize images (should use next/image)
4. Review cache settings in `src/lib/cache-manager.ts`

---

### Cache Not Working

**Issue:** Fresh content not showing

**Solutions:**
```bash
# Clear all caches
npm run cache:clear

# Refresh specific caches
npm run cache:manage
```

---

## Development Issues

### TypeScript Errors

**Issue:** Type errors after adding new features

**Solutions:**
1. Run type check: `npm run type-check`
2. Check `src/types/index.ts` for type definitions
3. Ensure all imports are typed
4. Add `// @ts-ignore` only as last resort

---

### Build Failures

**Issue:** `npm run build` fails

**Common causes:**
1. TypeScript errors → Run `npm run type-check`
2. ESLint errors → Run `npm run lint`
3. Missing environment variables → Check `.env.local`
4. Dependency issues → Try `rm -rf node_modules && npm install`

---

## WordPress Issues

### API Not Responding

**Issue:** WordPress REST API not accessible

**Check:**
1. WordPress site is online
2. Permalinks are set (not "Plain")
3. REST API is enabled
4. CORS headers configured
5. .htaccess is readable

**Test:**
```bash
curl https://your-wordpress.com/wp-json/
```

---

### Plugin Conflicts

**Issue:** Custom plugins not working

**Solutions:**
1. Deactivate all plugins except required ones
2. Activate plugins one by one to find conflict
3. Check WordPress error logs
4. Update WordPress and plugins to latest versions

---

## Deployment Issues

### Environment Variables Missing

**Issue:** Features not working in production

**Solution:**
1. Check all environment variables are set in hosting platform
2. Rebuild after adding/changing environment variables
3. Don't commit `.env.local` to Git
4. Use `.env.local.example` as template

---

### CORS Errors in Production

**Issue:** API calls blocked by CORS

**Solution:**
Update WordPress CORS settings to allow your production domain:

```php
// In WordPress functions.php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://your-production-domain.com');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
});
```

---

## Database Issues

### Connection Errors

**Issue:** Cannot connect to WordPress database

**Check:**
1. Database credentials in WordPress `wp-config.php`
2. Database server is running
3. Database user has correct permissions
4. Database host is correct (localhost vs. IP)

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot read properties of null (reading 'removeChild')` | Hydration mismatch | Add isMounted check (see above) |
| `No authorization token provided` | JWT token missing | Re-login |
| `Failed to fetch` | CORS or network issue | Check CORS & API URL |
| `Invalid token` | JWT expired or invalid | Re-login, check JWT config |
| `404 Not Found` | Wrong API URL | Verify environment variables |
| `500 Internal Server Error` | Server-side error | Check WordPress error logs |

---

## Debugging Tips

### Enable Debug Mode

**WordPress:**
```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**Next.js:**
```bash
# Check logs
npm run dev

# Check production build
npm run build
npm run start
```

### Browser DevTools

1. **Console Tab:** Check for JavaScript errors
2. **Network Tab:** Check API requests/responses
3. **Application Tab:** Check localStorage/cookies
4. **React DevTools:** Inspect component state

---

## Getting More Help

### Documentation

- [Project Guide](./PROJECT_GUIDE.md)
- [Admin SEO Panel Guide](./ADMIN_SEO_PANEL_GUIDE.md)
- [SEO Guide](./SEO_GUIDE.md)
- [WordPress Setup](./wordpress-setup.md)
- [WooCommerce Setup](./WOOCOMMERCE_SETUP.md)

### Check Logs

**WordPress:**
- Location: `/wp-content/debug.log`
- Enable: `WP_DEBUG_LOG` in `wp-config.php`

**Next.js:**
- Terminal output during `npm run dev`
- Check browser console

### Common Solutions

1. **Clear cache:** `npm run cache:clear`
2. **Rebuild:** `npm run build`
3. **Reinstall:** `rm -rf node_modules && npm install`
4. **Re-login:** Clear localStorage and login again
5. **Check environment variables:** Compare with `.env.local.example`

---

**Last Updated:** November 2025  
**Version:** 1.0.0

