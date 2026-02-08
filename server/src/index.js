import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const safeFilename = (name) =>
  String(name || 'upload')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = safeFilename(path.basename(file.originalname || 'image', ext));
    cb(null, `${Date.now()}-${base || 'image'}${ext || '.jpg'}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

const signCustomerToken = (customer) =>
  jwt.sign(
    { sub: customer.id, role: 'customer', email: customer.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireCustomer = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'customer') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    req.customer = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const normalizeSlug = (value) => (typeof value === 'string' ? value.trim() : value);

const mapProduct = (product) => ({
  id: product.id,
  slug: normalizeSlug(product.slug),
  name: product.name,
  sku: product.sku,
  price: product.price,
  originalPrice: product.originalPrice,
  stock: product.stock,
  status: product.status,
  image: product.image,
  badge: product.badge,
  rating: product.rating,
  category: product.category?.name ?? 'Uncategorized',
  shortDescription: product.shortDescription,
  description: product.description,
  details: product.details ?? [],
  featured: product.featured,
  trending: product.trending,
});

const mapCart = (cart) => ({
  id: cart.id,
  status: cart.status,
  items: cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: mapProduct(item.product),
  })),
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image,
    description: category.description,
    isActive: category.isActive,
  })));
});

app.get('/api/settings', async (_req, res) => {
  const settings = await prisma.siteSettings.findFirst();
  res.json(settings ?? {});
});

app.get('/api/social-links', async (_req, res) => {
  const items = await prisma.socialLink.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
  });
  res.json(items);
});

app.get('/api/payment-badges', async (_req, res) => {
  const items = await prisma.paymentBadge.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
  });
  res.json(items);
});

app.get('/api/home/hero', async (_req, res) => {
  const hero = await prisma.heroSection.findFirst({ orderBy: { updatedAt: 'desc' } });
  res.json(hero ?? {});
});

app.get('/api/home/features', async (_req, res) => {
  const items = await prisma.featureItem.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
  });
  res.json(items);
});

app.get('/api/home/promos', async (_req, res) => {
  const items = await prisma.promoBanner.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
  });
  res.json(items);
});

app.get('/api/home/categories', async (_req, res) => {
  const items = await prisma.homeCategoryHighlight.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
    include: { category: true },
  });
  res.json(items);
});

app.get('/api/home/products', async (req, res) => {
  const { type } = req.query;
  const where = {
    isActive: true,
    ...(type ? { type: String(type) } : {}),
  };
  const items = await prisma.homeProductHighlight.findMany({
    where,
    orderBy: { position: 'asc' },
    include: { product: { include: { category: true } } },
  });
  res.json(
    items.map((item) => ({
      ...item,
      product: item.product ? mapProduct(item.product) : null,
    }))
  );
});

app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, email, password, phone, address } = req.body ?? {};
  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use.' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      phone: phone ?? null,
      address: address ?? null,
    },
  });
  res.status(201).json({
    token: signCustomerToken(customer),
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' });
    return;
  }
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const ok = await bcrypt.compare(password, customer.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({
    token: signCustomerToken(customer),
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    },
  });
});

app.get('/api/auth/me', requireCustomer, async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.customer.sub },
  });
  if (!customer) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
  });
});

app.patch('/api/auth/me', requireCustomer, async (req, res) => {
  const { firstName, lastName, phone, address } = req.body ?? {};
  try {
    const customer = await prisma.customer.update({
      where: { id: req.customer.sub },
      data: {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        phone: phone ?? undefined,
        address: address ?? undefined,
      },
    });
    res.json({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' });
    return;
  }
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({
    token: signToken(admin),
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});

app.get('/api/admin/me', requireAdmin, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({ where: { id: req.admin.sub } });
  if (!admin) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });
});

app.use('/api/admin', requireAdmin);

app.post('/api/admin/uploads', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'file is required' });
    return;
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ url: `${baseUrl}/uploads/${req.file.filename}` });
});

// Admin - Orders
app.get('/api/admin/orders', async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  res.json(orders);
});

app.patch('/api/admin/orders/:id', async (req, res) => {
  try {
    const { status } = req.body ?? {};
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
    res.json(order);
  } catch (error) {
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

// Admin - Categories
app.get('/api/admin/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

app.post('/api/admin/categories', async (req, res) => {
  const { name, slug, description, image, isActive } = req.body ?? {};
  if (!name || !slug) {
    res.status(400).json({ error: 'name and slug are required' });
    return;
  }
  const category = await prisma.category.create({
    data: { name, slug, description, image, isActive: isActive ?? true },
  });
  res.status(201).json(category);
});

app.patch('/api/admin/categories/:id', async (req, res) => {
  const { name, slug, description, image, isActive } = req.body ?? {};
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { name, slug, description, image, isActive },
  });
  res.json(category);
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    const productCount = await prisma.product.count({
      where: { categoryId: req.params.id },
    });
    if (productCount > 0) {
      res.status(409).json({
        error: 'Category has products. Move or delete products first.',
      });
      return;
    }
    await prisma.homeCategoryHighlight.deleteMany({
      where: { categoryId: req.params.id },
    });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Delete failed' });
  }
});

// Admin - Products
app.get('/api/admin/products', async (_req, res) => {
  const products = await prisma.product.findMany({ include: { category: true, images: true } });
  res.json(products);
});

app.post('/api/admin/products', async (req, res) => {
  const {
    slug,
    name,
    sku,
    price,
    originalPrice,
    stock,
    status,
    image,
    badge,
    rating,
    shortDescription,
    description,
    details,
    featured,
    trending,
    categoryId,
  } = req.body ?? {};

  if (!slug || !name || price == null || !image || !description || !categoryId) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }

  const product = await prisma.product.create({
    data: {
      slug: normalizeSlug(slug),
      name,
      sku,
      price: Number(price),
      originalPrice: originalPrice ?? null,
      stock: stock ?? 0,
      status: status ?? 'active',
      image,
      badge,
      rating,
      shortDescription,
      description,
      details: Array.isArray(details) ? details : [],
      featured: Boolean(featured),
      trending: Boolean(trending),
      categoryId,
    },
  });
  res.status(201).json(product);
});

app.patch('/api/admin/products/:id', async (req, res) => {
  try {
    const {
      slug,
      name,
      sku,
      price,
      originalPrice,
      stock,
      status,
      image,
      badge,
      rating,
      shortDescription,
      description,
      details,
      featured,
      trending,
      categoryId,
    } = req.body ?? {};

    const data = {
      slug: normalizeSlug(slug),
      name,
      sku: sku ?? null,
      price: price != null ? Number(price) : undefined,
      originalPrice: originalPrice === '' ? null : originalPrice ?? null,
      stock: stock != null ? Number(stock) : undefined,
      status,
      image,
      badge,
      rating: rating == null || rating === '' ? null : Number(rating),
      shortDescription,
      description,
      details: Array.isArray(details) ? details : [],
      featured: Boolean(featured),
      trending: Boolean(trending),
    };

    if (categoryId) {
      data.category = { connect: { id: categoryId } };
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const orderCount = await prisma.orderItem.count({
      where: { productId: req.params.id },
    });
    if (orderCount > 0) {
      res.status(409).json({
        error: 'Product is linked to orders. Archive it instead of deleting.',
      });
      return;
    }

    await prisma.cartItem.deleteMany({ where: { productId: req.params.id } });
    await prisma.homeProductHighlight.deleteMany({ where: { productId: req.params.id } });

    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Delete failed' });
  }
});

// Admin - Site settings
app.get('/api/admin/settings', async (_req, res) => {
  const settings = await prisma.siteSettings.findFirst();
  res.json(settings ?? {});
});

app.put('/api/admin/settings', async (req, res) => {
  const existing = await prisma.siteSettings.findFirst();
  const data = req.body ?? {};
  const settings = existing
    ? await prisma.siteSettings.update({ where: { id: existing.id }, data })
    : await prisma.siteSettings.create({ data });
  res.json(settings);
});

// Admin - Home sections
app.get('/api/admin/hero', async (_req, res) => {
  const hero = await prisma.heroSection.findFirst({ orderBy: { updatedAt: 'desc' } });
  res.json(hero ?? {});
});

app.put('/api/admin/hero', async (req, res) => {
  const existing = await prisma.heroSection.findFirst();
  const data = req.body ?? {};
  const hero = existing
    ? await prisma.heroSection.update({ where: { id: existing.id }, data })
    : await prisma.heroSection.create({ data });
  res.json(hero);
});

app.get('/api/admin/features', async (_req, res) => {
  const items = await prisma.featureItem.findMany({ orderBy: { position: 'asc' } });
  res.json(items);
});

app.post('/api/admin/features', async (req, res) => {
  const item = await prisma.featureItem.create({ data: req.body ?? {} });
  res.status(201).json(item);
});

app.patch('/api/admin/features/:id', async (req, res) => {
  const item = await prisma.featureItem.update({ where: { id: req.params.id }, data: req.body ?? {} });
  res.json(item);
});

app.delete('/api/admin/features/:id', async (req, res) => {
  await prisma.featureItem.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

app.get('/api/admin/promo-banners', async (_req, res) => {
  const items = await prisma.promoBanner.findMany({ orderBy: { position: 'asc' } });
  res.json(items);
});

app.post('/api/admin/promo-banners', async (req, res) => {
  const item = await prisma.promoBanner.create({ data: req.body ?? {} });
  res.status(201).json(item);
});

app.patch('/api/admin/promo-banners/:id', async (req, res) => {
  const item = await prisma.promoBanner.update({ where: { id: req.params.id }, data: req.body ?? {} });
  res.json(item);
});

app.delete('/api/admin/promo-banners/:id', async (req, res) => {
  await prisma.promoBanner.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

app.get('/api/admin/home-categories', async (_req, res) => {
  const items = await prisma.homeCategoryHighlight.findMany({
    orderBy: { position: 'asc' },
    include: { category: true },
  });
  res.json(items);
});

app.post('/api/admin/home-categories', async (req, res) => {
  const { categoryId, position, isActive } = req.body ?? {};
  if (!categoryId) {
    res.status(400).json({ error: 'categoryId is required' });
    return;
  }
  const existing = await prisma.homeCategoryHighlight.findFirst({
    where: { categoryId },
  });
  if (existing) {
    res.status(409).json({ error: 'Category already highlighted.' });
    return;
  }
  const item = await prisma.homeCategoryHighlight.create({
    data: {
      categoryId,
      position: position ?? 0,
      isActive: isActive ?? true,
    },
  });
  res.status(201).json(item);
});

app.patch('/api/admin/home-categories/:id', async (req, res) => {
  try {
    const { categoryId, position, isActive } = req.body ?? {};
    if (!categoryId) {
      res.status(400).json({ error: 'categoryId is required' });
      return;
    }
    const existing = await prisma.homeCategoryHighlight.findFirst({
      where: { categoryId, NOT: { id: req.params.id } },
    });
    if (existing) {
      res.status(409).json({ error: 'Category already highlighted.' });
      return;
    }
    const item = await prisma.homeCategoryHighlight.update({
      where: { id: req.params.id },
      data: {
        categoryId,
        position: position ?? 0,
        isActive: isActive ?? true,
      },
    });
    res.json(item);
  } catch (error) {
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

app.delete('/api/admin/home-categories/:id', async (req, res) => {
  await prisma.homeCategoryHighlight.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

app.get('/api/admin/home-products', async (_req, res) => {
  const items = await prisma.homeProductHighlight.findMany({
    orderBy: { position: 'asc' },
    include: { product: true },
  });
  res.json(items);
});

app.post('/api/admin/home-products', async (req, res) => {
  const item = await prisma.homeProductHighlight.create({ data: req.body ?? {} });
  res.status(201).json(item);
});

app.patch('/api/admin/home-products/:id', async (req, res) => {
  const item = await prisma.homeProductHighlight.update({
    where: { id: req.params.id },
    data: req.body ?? {},
  });
  res.json(item);
});

app.delete('/api/admin/home-products/:id', async (req, res) => {
  await prisma.homeProductHighlight.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

app.get('/api/admin/social-links', async (_req, res) => {
  const items = await prisma.socialLink.findMany({ orderBy: { position: 'asc' } });
  res.json(items);
});

app.post('/api/admin/social-links', async (req, res) => {
  const item = await prisma.socialLink.create({ data: req.body ?? {} });
  res.status(201).json(item);
});

app.patch('/api/admin/social-links/:id', async (req, res) => {
  const item = await prisma.socialLink.update({ where: { id: req.params.id }, data: req.body ?? {} });
  res.json(item);
});

app.delete('/api/admin/social-links/:id', async (req, res) => {
  await prisma.socialLink.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

app.get('/api/admin/payment-badges', async (_req, res) => {
  const items = await prisma.paymentBadge.findMany({ orderBy: { position: 'asc' } });
  res.json(items);
});

app.post('/api/admin/payment-badges', async (req, res) => {
  const item = await prisma.paymentBadge.create({ data: req.body ?? {} });
  res.status(201).json(item);
});

app.patch('/api/admin/payment-badges/:id', async (req, res) => {
  const item = await prisma.paymentBadge.update({ where: { id: req.params.id }, data: req.body ?? {} });
  res.json(item);
});

app.delete('/api/admin/payment-badges/:id', async (req, res) => {
  await prisma.paymentBadge.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  const where = category
    ? {
        category: {
          OR: [
            { slug: String(category) },
            { name: { equals: String(category), mode: 'insensitive' } },
          ],
        },
      }
    : undefined;

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
  });
  res.json(products.map(mapProduct));
});

app.get('/api/products/:slug', async (req, res) => {
  const slugParam = normalizeSlug(req.params.slug ?? '');
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: { equals: slugParam, mode: 'insensitive' } },
        { slug: { startsWith: slugParam, mode: 'insensitive' } },
      ],
    },
    include: { category: true },
  });

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  res.json(mapProduct(product));
});

app.post('/api/carts', async (_req, res) => {
  const cart = await prisma.cart.create({
    data: {},
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  res.status(201).json(mapCart(cart));
});

app.get('/api/carts/:id', async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }

  res.json(mapCart(cart));
});

app.post('/api/carts/:id/items', async (req, res) => {
  const { productId, quantity } = req.body ?? {};

  if (!productId || !quantity || quantity <= 0) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const cart = await prisma.cart.findUnique({
    where: { id: req.params.id },
  });

  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + Number(quantity) },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: Number(quantity),
      },
    });
  }

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  res.status(201).json(mapCart(updatedCart));
});

app.patch('/api/carts/:id/items/:itemId', async (req, res) => {
  const { quantity } = req.body ?? {};
  const cart = await prisma.cart.findUnique({
    where: { id: req.params.id },
  });

  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: req.params.itemId },
  });

  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  if (!quantity || quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Number(quantity) },
    });
  }

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  res.json(mapCart(updatedCart));
});

app.delete('/api/carts/:id/items/:itemId', async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { id: req.params.id },
  });

  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }

  await prisma.cartItem.delete({ where: { id: req.params.itemId } });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  res.json(mapCart(updatedCart));
});

app.delete('/api/carts/:id/items', async (req, res) => {
  const cart = await prisma.cart.findUnique({
    where: { id: req.params.id },
  });

  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  res.json(mapCart(updatedCart));
});

app.post('/api/orders', async (req, res) => {
  const { cartId, customer } = req.body ?? {};

  if (!cartId || !customer) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: { include: { category: true } } } } },
  });

  if (!cart) {
    res.status(404).json({ error: 'Cart not found' });
    return;
  }

  if (cart.items.length === 0) {
    res.status(400).json({ error: 'Cart is empty' });
    return;
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      total,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress: customer.address,
      items: {
        create: cart.items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  res.status(201).json(order);
});

app.post('/api/orders/checkout', requireCustomer, async (req, res) => {
  const { items, address, phone, notes, firstName, lastName } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0 || !address) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const customer = await prisma.customer.findUnique({
    where: { id: req.customer.sub },
  });
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems = [];
  let total = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      res.status(400).json({ error: 'Invalid product in cart.' });
      return;
    }
    const quantity = Number(item.quantity);
    if (!quantity || quantity <= 0) {
      res.status(400).json({ error: 'Invalid quantity.' });
      return;
    }
    total += product.price * quantity;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      firstName: firstName ?? customer.firstName,
      lastName: lastName ?? customer.lastName,
      phone: phone ?? customer.phone ?? null,
      address,
    },
  });

  const order = await prisma.order.create({
    data: {
      customerId: updatedCustomer.id,
      customerName: `${updatedCustomer.firstName} ${updatedCustomer.lastName}`.trim(),
      customerEmail: updatedCustomer.email,
      customerPhone: updatedCustomer.phone ?? '',
      shippingAddress: address,
      notes: notes ?? null,
      total,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  res.status(201).json(order);
});

app.get('/api/orders/mine', requireCustomer, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.customer.sub },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } },
    },
  });
  res.json(orders);
});

app.get('/api/orders/mine/:id', requireCustomer, async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, customerId: req.customer.sub },
    include: {
      items: { include: { product: true } },
    },
  });
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
