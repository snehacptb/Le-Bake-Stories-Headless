# Headless WordPress + Next.js Ecommerce with Themes Design System

A modern, high-performance headless ecommerce solution built with WordPress (WooCommerce) as the backend CMS and Next.js as the frontend, featuring the Themes Design System with shadcn/ui and Aceternity UI components.

## 🚀 Features

### Frontend (Next.js)
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Aceternity UI** for advanced animations
- **Framer Motion** for smooth animations
- **Themes Design System** - reusable component library

### Backend (WordPress)
- **Headless WordPress** with REST API
- **WooCommerce** for ecommerce functionality
- **Advanced Custom Fields (ACF)** for flexible content
- **JWT Authentication** for secure API access

### Ecommerce Features
- Product catalog with filtering and sorting
- Shopping cart with persistent storage
- Product search and categories
- Wishlist functionality
- Customer accounts
- Order management
- Payment integration ready

### Performance & SEO
- Server-side rendering (SSR)
- Static site generation (SSG)
- Incremental static regeneration (ISR)
- Image optimization
- Core Web Vitals optimization
- SEO-friendly URLs and meta tags

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Aceternity UI
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Data Fetching**: SWR
- **Forms**: React Hook Form + Zod validation

### Backend
- **CMS**: WordPress 6.4+
- **Ecommerce**: WooCommerce
- **API**: WordPress REST API + WooCommerce REST API
- **Database**: MySQL 8.0+
- **Caching**: Redis (optional)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- WordPress installation with WooCommerce
- MySQL database

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd headless-wordpress-nextjs
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Copy `.env.local` and configure your environment variables:

```bash
cp .env.local .env.local
```

Update the following variables:
```env
# WordPress API Configuration
WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2
WORDPRESS_BASE_URL=https://your-wordpress-site.com

# WooCommerce API Configuration
WOOCOMMERCE_API_URL=https://your-wordpress-site.com/wp-json/wc/v3
WORDPRESS_CONSUMER_KEY=ck_your_consumer_key_here
WORDPRESS_CONSUMER_SECRET=cs_your_consumer_secret_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 4. WordPress Setup

#### Install Required Plugins
1. **WooCommerce** - For ecommerce functionality
2. **Advanced Custom Fields (ACF)** - For custom fields
3. **JWT Authentication for WP REST API** - For secure authentication
4. **WP REST API Cache** - For performance (optional)

#### Configure WooCommerce API
1. Go to WooCommerce → Settings → Advanced → REST API
2. Create a new API key with Read/Write permissions
3. Copy the Consumer Key and Consumer Secret to your `.env.local`



### 5. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your site.

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── blog/              # Blog pages
│   ├── shop/              # Shop pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/
│   ├── themes/             # Themes Design System components
│   │   ├── header.tsx     # Site header
│   │   ├── footer.tsx     # Site footer
│   │   ├── layout.tsx     # Main layout wrapper
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── blog-card.tsx
│   │   ├── cart-drawer.tsx
│   │   └── hero-section.tsx
│   └── ui/                # Base UI components (shadcn/ui)
├── lib/
│   ├── api.ts             # WordPress/WooCommerce API client
│   └── utils.ts           # Utility functions
├── types/
│   └── index.ts           # TypeScript type definitions
└── styles/
    └── globals.css        # Global styles and Tailwind config
```

## 🎨 Themes Design System

The Themes Design System provides a comprehensive set of reusable components:

### Core Components
- **ThemesLayout** - Main layout wrapper with cart functionality
- **ThemesHeader** - Responsive navigation with search and cart
- **ThemesFooter** - Rich footer with newsletter and links
- **HeroSection** - Customizable hero slider
- **ProductCard** - Product display with variants
- **ProductGrid** - Product listing with filters
- **BlogCard** - Blog post display with variants
- **CartDrawer** - Sliding cart panel

### UI Components (shadcn/ui based)
- Button, Card, Input, Badge, Skeleton
- All components are customizable and theme-aware
- Consistent design language across the application

## 🛒 Ecommerce Features

### Product Management
- Product catalog with categories and tags
- Product variants and attributes
- Inventory management
- Featured and sale products
- Product search and filtering

### Shopping Cart
- Persistent cart storage (localStorage)
- Add/remove/update cart items
- Cart drawer with quick actions
- Cart totals and shipping calculation

### Customer Features
- Customer registration and login
- Order history and tracking
- Wishlist functionality
- Account management

## 📱 Responsive Design

The design system is fully responsive with:
- Mobile-first approach
- Breakpoint-specific layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## ⚡ Performance Optimizations

### Next.js Features
- **SSG** for static pages (homepage, about, etc.)
- **SSR** for dynamic content (product pages, blog posts)
- **ISR** for updated content without full rebuilds
- **Image Optimization** with next/image
- **Code Splitting** for optimal bundle sizes

### Caching Strategy
- API response caching with SWR
- Static asset caching with CDN
- Browser caching with proper headers
- Redis caching for WordPress (optional)

## 🔧 Customization

### Styling
- Modify `tailwind.config.js` for design tokens
- Update `src/styles/globals.css` for global styles
- Customize component variants in individual files

### Components
- All Themes components accept props for customization
- Extend base components for specific needs
- Add new components following the established patterns

### API Integration
- Extend `src/lib/api.ts` for additional endpoints
- Add new types in `src/types/index.ts`
- Implement custom hooks for data fetching

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Other Platforms
```bash
npm run build
npm start
```

### Environment Variables
Ensure all production environment variables are set:
- WordPress API URLs (production)
- WooCommerce API credentials
- NextAuth configuration
- Any third-party API keys

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 📚 Documentation

### WordPress Setup Guide
See `docs/wordpress-setup.md` for detailed WordPress configuration.

### Component Documentation
Each Themes component includes TypeScript interfaces and JSDoc comments.

### API Reference
See `docs/api-reference.md` for WordPress and WooCommerce API usage.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in the `docs/` folder
- Open an issue on GitHub
- Contact the development team

## 🔄 Updates

This project follows semantic versioning. Check the CHANGELOG.md for updates and breaking changes.

---

Built with ❤️ using WordPress, Next.js, and the Themes Design System.
