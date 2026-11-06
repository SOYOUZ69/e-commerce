# E-commerce Meta Commerce Setup

This project is prepared for Meta Commerce Catalog + Meta Pixel integration.

## Product Feed

- Public feed URL: `https://espacemariages.com/meta/product-feed.csv`
- API fallback URL: `https://espacemariages.com/api/meta/product-feed.csv`
- Source: live products from Prisma (`Product` + `Category` + `ProductImage`)

The feed is generated dynamically by the backend route:
- `GET /meta/product-feed.csv`
- `GET /api/meta/product-feed.csv`

### Feed Mapping (Meta Catalog)

| Meta field | Source |
|---|---|
| `id` | `product.id` |
| `title` | `product.name` |
| `description` | `product.shortDescription` fallback `product.description` (HTML stripped) |
| `availability` | constant `in stock` |
| `condition` | constant `new` |
| `price` | `product.price` formatted as `0.00 <CURRENCY>` |
| `link` | `https://espacemariages.com/product/:slug` |
| `image_link` | primary product image (`images` or `image`) as absolute URL |
| `brand` | `META_FEED_BRAND` (default: `Espace Mariage`) |
| `category` | `category.name` |

## Product URL and SEO

- Canonical product URL: `/product/:slug`
- Legacy `/products/:slug` is redirected to `/product/:slug`
- Product pages now inject:
  - canonical link
  - OpenGraph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
  - Product structured data (JSON-LD) with name, price, currency, availability, image, description

## Meta Pixel

Pixel is controlled by `VITE_META_PIXEL_ID`.

Implemented events:
- `PageView` (on route changes)
- `ViewContent` (product detail page)
- `AddToCart` (centralized in cart store)
- `InitiateCheckout` (checkout entry)
- `Purchase` (after successful checkout)

Event payload includes product identifiers and pricing data with currency.

## Environment Variables

Frontend build vars:
- `VITE_SITE_URL` (example: `https://espacemariages.com`)
- `VITE_META_PIXEL_ID`
- `VITE_META_CURRENCY` (default: `TND`)
- `VITE_META_BRAND` (default: `Espace Mariage`)

Backend vars for feed:
- `META_FEED_SITE_URL` (default: `https://espacemariages.com`)
- `META_FEED_CURRENCY` (default: `TND`)
- `META_FEED_BRAND` (default: `Espace Mariage`)

## Public Access Checklist

1. Product pages return 200 publicly at `/product/:slug`
2. Product images are publicly reachable (`/uploads/...` or absolute image URLs)
3. Feed URL returns CSV publicly at `/meta/product-feed.csv`
4. Meta crawler can access the feed and product links over HTTPS
