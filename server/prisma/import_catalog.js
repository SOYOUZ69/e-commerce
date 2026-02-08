import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.resolve(__dirname, '..', '..', 'guidelines', 'import_step1_catalog_FULL.json');

const inputPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : defaultPath;

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(raw);

const prisma = new PrismaClient();

const stripHtml = (value) =>
  String(value || '')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractDetails = (value) => {
  const matches = String(value || '').match(/<li[^>]*>(.*?)<\/li>/gi) || [];
  return matches
    .map((item) => item.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

const toStatus = (value) => (value === 'ACTIVE' ? 'active' : 'draft');

const getImageUrl = (media) => {
  if (!Array.isArray(media) || media.length === 0) {
    return '/images/reflet d’art (1).webp';
  }
  const primary = media.find((item) => item.isPrimary) ?? media[0];
  return primary?.url ?? '/images/reflet d’art (1).webp';
};

const main = async () => {
  const categories = data.categories ?? [];
  const products = data.products ?? [];

  console.log(`Importing ${categories.length} categories, ${products.length} products...`);

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description ?? null,
        image: category.imageUrl ?? category.imageUrlMobile ?? null,
        isActive: category.status === 'ACTIVE',
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
        image: category.imageUrl ?? category.imageUrlMobile ?? null,
        isActive: category.status === 'ACTIVE',
      },
    });
  }

  const categoryMap = new Map(
    categories.map((category) => [category.slug, category])
  );

  let imported = 0;
  for (const product of products) {
    const category = categoryMap.get(product.categorySlug);
    if (!category) {
      continue;
    }

    const description = stripHtml(product.description);
    const details = extractDetails(product.description);
    const image = getImageUrl(product.media);

    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: product.sku ?? null,
        price: 0,
        originalPrice: null,
        stock: product.stock ?? 0,
        status: toStatus(product.status),
        image,
        badge: null,
        rating: null,
        shortDescription: null,
        description,
        details,
        featured: false,
        trending: false,
        category: { connect: { slug: category.slug } },
      },
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku ?? null,
        price: 0,
        originalPrice: null,
        stock: product.stock ?? 0,
        status: toStatus(product.status),
        image,
        badge: null,
        rating: null,
        shortDescription: null,
        description,
        details,
        featured: false,
        trending: false,
        category: { connect: { slug: category.slug } },
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    if (Array.isArray(product.media) && product.media.length > 0) {
      await prisma.productImage.createMany({
        data: product.media.map((item, index) => ({
          productId: created.id,
          url: item.url,
          alt: item.alt ?? product.name,
          isPrimary: Boolean(item.isPrimary),
          position: item.sortOrder ?? index,
        })),
      });
    }

    imported += 1;
  }

  console.log(`Imported ${imported} products.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
