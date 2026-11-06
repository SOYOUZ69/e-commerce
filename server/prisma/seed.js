import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const products = [
  {
    slug: 'classic-gold-necklace',
    name: 'Classic Gold Necklace',
    price: 299,
    originalPrice: 399,
    image:
      'https://images.unsplash.com/photo-1758995115475-7b7d6eb060ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBqZXdlbHJ5JTIwZ29sZHxlbnwxfHx8fDE3NjY4NTIzNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'Sale',
    rating: 5,
    category: 'Jewelry',
    description:
      'A timeless 18k-inspired necklace with a soft brushed finish and secure clasp.',
    details: ['18k-inspired alloy', 'Adjustable length', 'Gift-ready box'],
    featured: true,
    trending: true,
  },
  {
    slug: 'premium-watch-collection',
    name: 'Premium Watch Collection',
    price: 599,
    image:
      'https://images.unsplash.com/photo-1760532466974-f969f56dfcc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd2F0Y2glMjBwcmVtaXVtfGVufDF8fHx8MTc2NjkzOTk5NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'New',
    rating: 5,
    category: 'Watches',
    description:
      'Minimalist dial with premium leather strap, built for everyday elegance.',
    details: ['Quartz movement', 'Water resistant', '2-year warranty'],
    featured: true,
  },
  {
    slug: 'luxury-leather-handbag',
    name: 'Luxury Leather Handbag',
    price: 449,
    image:
      'https://images.unsplash.com/photo-1598099947145-e85739e7ca28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBoYW5kYmFnJTIwbGVhdGhlcnxlbnwxfHx8fDE3NjY5Mzk5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    category: 'Bags',
    description:
      'Structured silhouette with buttery leather and polished metal hardware.',
    details: ['Genuine leather', 'Interior organizer', 'Magnetic closure'],
    featured: true,
  },
  {
    slug: 'premium-cosmetics-set',
    name: 'Premium Cosmetics Set',
    price: 189,
    originalPrice: 249,
    image:
      'https://images.unsplash.com/photo-1761845047498-56827f416735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwY29zbWV0aWNzJTIwYm90dGxlfGVufDF8fHx8MTc2NjkzOTk5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'Sale',
    rating: 4,
    category: 'Beauty',
    description:
      'A curated set of essentials for a luminous, hydrated look.',
    details: ['Clean ingredients', 'Travel friendly', 'Dermatologist tested'],
    featured: true,
  },
  {
    slug: 'luxury-perfume-bottle',
    name: 'Luxury Perfume Bottle',
    price: 229,
    image:
      'https://images.unsplash.com/photo-1719175936556-dbd05e415913?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwYm90dGxlfGVufDF8fHx8MTc2Njg2MzA3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'New',
    rating: 5,
    category: 'Beauty',
    description:
      'Warm amber notes with a long-lasting finish and elegant bottle design.',
    details: ['Eau de parfum', '50 ml', 'Signature packaging'],
    featured: true,
    trending: true,
  },
  {
    slug: 'designer-sunglasses',
    name: 'Designer Sunglasses',
    price: 349,
    image:
      'https://images.unsplash.com/photo-1758888676940-9a807f0b7a8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwc3VuZ2xhc3NlcyUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc2NjkzOTk5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    category: 'Accessories',
    description:
      'Oversized frames with UV protection and a polished acetate finish.',
    details: ['UV400', 'Lightweight', 'Protective case'],
    featured: true,
  },
  {
    slug: 'elegant-home-decor',
    name: 'Elegant Home Decor',
    price: 279,
    originalPrice: 349,
    image:
      'https://images.unsplash.com/photo-1707376519357-b53e370384fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob21lJTIwZGVjb3J8ZW58MXx8fHwxNzY2ODQ0ODYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'Sale',
    rating: 5,
    category: 'Home',
    description:
      'Soft textures and warm tones to elevate your interior palette.',
    details: ['Hand-finished', 'Neutral palette', 'Limited release'],
    featured: true,
  },
  {
    slug: 'premium-fashion-set',
    name: 'Premium Fashion Set',
    price: 499,
    image:
      'https://images.unsplash.com/photo-1622080157653-830e675f14c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZmFzaGlvbiUyMG1vZGVsfGVufDF8fHx8MTc2NjkzOTk5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'New',
    rating: 5,
    category: 'Fashion',
    description:
      'Coordinated pieces designed for refined layering and day-to-night wear.',
    details: ['Tailored fit', 'Seasonal palette', 'Limited edition'],
    trending: true,
  },
  {
    slug: 'elegant-gold-ring',
    name: 'Elegant Gold Ring',
    price: 199,
    image:
      'https://images.unsplash.com/photo-1758995115475-7b7d6eb060ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBqZXdlbHJ5JTIwZ29sZHxlbnwxfHx8fDE3NjY4NTIzNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'Trending',
    rating: 5,
    category: 'Jewelry',
    description:
      'Slim band with a subtle sparkle that complements any stack.',
    details: ['Polished finish', 'Comfort fit', 'Gift-ready box'],
    trending: true,
  },
  {
    slug: 'designer-tote-bag',
    name: 'Designer Tote Bag',
    price: 399,
    originalPrice: 499,
    image:
      'https://images.unsplash.com/photo-1598099947145-e85739e7ca28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBoYW5kYmFnJTIwbGVhdGhlcnxlbnwxfHx8fDE3NjY5Mzk5OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'Sale',
    rating: 5,
    category: 'Bags',
    description:
      'Oversized tote with a structured base and roomy interior.',
    details: ['Reinforced straps', 'Soft lining', 'Everyday carry'],
    trending: true,
  },
  {
    slug: 'beauty-essentials',
    name: 'Beauty Essentials',
    price: 149,
    image:
      'https://images.unsplash.com/photo-1761845047498-56827f416735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwY29zbWV0aWNzJTIwYm90dGxlfGVufDF8fHx8MTc2NjkzOTk5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    badge: 'New',
    rating: 4,
    category: 'Beauty',
    description:
      'Everyday essentials for a fresh, natural finish.',
    details: ['Vegan formula', 'Lightweight', 'Travel ready'],
    trending: true,
  },
  {
    slug: 'signature-fragrance',
    name: 'Signature Fragrance',
    price: 279,
    image:
      'https://images.unsplash.com/photo-1719175936556-dbd05e415913?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwYm90dGxlfGVufDF8fHx8MTc2Njg2MzA3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    category: 'Beauty',
    description:
      'Layered notes of citrus, amber, and musk that linger all day.',
    details: ['Eau de parfum', '75 ml', 'Refillable bottle'],
    trending: true,
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required for seeding.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
  });

  const categories = Array.from(new Set(products.map((item) => item.category)));

  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: slugify(product.category) },
    });

    if (!category) {
      continue;
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        badge: product.badge,
        rating: product.rating,
        description: product.description,
        details: product.details,
        featured: Boolean(product.featured),
        trending: Boolean(product.trending),
        categoryId: category.id,
      },
      create: {
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        badge: product.badge,
        rating: product.rating,
        description: product.description,
        details: product.details,
        featured: Boolean(product.featured),
        trending: Boolean(product.trending),
        categoryId: category.id,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
