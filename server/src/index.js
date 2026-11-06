import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
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
const INVENTORY_CLIENT_ID = process.env.INVENTORY_CLIENT_ID || '';
const INVENTORY_CLIENT_SECRET = process.env.INVENTORY_CLIENT_SECRET || '';

// Honor X-Forwarded-* headers from nginx to build correct absolute URLs.
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

// Les colonnes monetaires sont en Decimal cote Prisma : on les renvoie en nombres
// JSON plutot qu'en chaines, pour garder le contrat d'API attendu par le front.
const toPlainAmounts = (value) => {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  if (Array.isArray(value)) {
    return value.map(toPlainAmounts);
  }
  if (value && typeof value === 'object' && value.constructor === Object) {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = toPlainAmounts(item);
    }
    return out;
  }
  return value;
};

app.use((_req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (body) => sendJson(toPlainAmounts(body));
  next();
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Les reponses de l'API ne doivent jamais etre mises en cache par le navigateur :
// sans cet en-tete, seul un ETag est envoye et le navigateur applique sa propre
// heuristique, ce qui faisait resservir un ancien catalogue jusqu'au Ctrl+F5.
// Place APRES le montage de /uploads : les images, elles, gardent leur cache.
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const getUploadPath = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // ignore parsing errors for relative paths
  }
  if (!pathname.startsWith('/uploads/')) {
    return null;
  }
  const filename = path.basename(pathname);
  if (!filename) {
    return null;
  }
  return path.join(uploadsDir, filename);
};

const purgeUnusedUploads = async (urls) => {
  const unique = Array.from(
    new Set((urls ?? []).filter((item) => typeof item === 'string' && item.trim()))
  );
  if (unique.length === 0) {
    return;
  }

  const [productImages, productMain, categoryImages] = await Promise.all([
    prisma.productImage.findMany({
      where: { url: { in: unique } },
      select: { url: true },
    }),
    prisma.product.findMany({
      where: { image: { in: unique } },
      select: { image: true },
    }),
    prisma.category.findMany({
      where: { image: { in: unique } },
      select: { image: true },
    }),
  ]);

  const referenced = new Set([
    ...productImages.map((item) => item.url),
    ...productMain.map((item) => item.image),
    ...categoryImages.map((item) => item.image),
  ]);

  const toDelete = unique.filter((url) => !referenced.has(url));
  await Promise.all(
    toDelete.map(async (url) => {
      const filePath = getUploadPath(url);
      if (!filePath) {
        return;
      }
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        if (error && error.code !== 'ENOENT') {
          console.warn('Failed to delete upload', url, error);
        }
      }
    })
  );
};

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

const signInventoryToken = () =>
  jwt.sign({ sub: 'inventory-client', role: 'inventory' }, JWT_SECRET, {
    expiresIn: '30d',
  });

const requireAdmin = async (req, res, next) => {
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
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!admin || admin.role !== 'admin' || admin.email !== payload.email) {
      res.status(401).json({ error: 'Invalid token' });
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

const resolveCustomerFromAuthHeader = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'customer' || !payload.sub) {
      return null;
    }
    const customer = await prisma.customer.findUnique({
      where: { id: payload.sub },
    });
    return customer ?? null;
  } catch {
    return null;
  }
};

const requireInventory = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!['inventory', 'admin'].includes(payload.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    req.inventory = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const normalizeSlug = (value) => (typeof value === 'string' ? value.trim() : value);

const normalizeOptionValues = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
  return Array.from(new Set(normalized));
};

const parseDateParam = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const parseNumberParam = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolParam = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }
  return null;
};

const mapProductImages = (product) => {
  const items = Array.isArray(product.images) ? [...product.images] : [];
  if (items.length > 0) {
    items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return items.map((img, index) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? product.name,
      isPrimary: img.isPrimary ?? index === 0,
      position: img.position ?? index,
    }));
  }
  if (product.image) {
    return [
      {
        id: undefined,
        url: product.image,
        alt: product.name,
        isPrimary: true,
        position: 0,
      },
    ];
  }
  return [];
};

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
  images: mapProductImages(product),
  badge: product.badge,
  rating: product.rating,
  category: product.category?.name ?? 'Uncategorized',
  shortDescription: product.shortDescription,
  description: product.description,
  details: product.details ?? [],
  optionLabel: product.optionLabel ?? null,
  optionValues: normalizeOptionValues(product.optionValues ?? []),
  featured: product.featured,
  trending: product.trending,
});

const normalizeImageList = (image, images) => {
  const list = [];
  const push = (value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (!list.includes(trimmed)) {
      list.push(trimmed);
    }
  };
  push(image);
  if (Array.isArray(images)) {
    images.forEach(push);
  }
  return list;
};

const mapCart = (cart) => ({
  id: cart.id,
  status: cart.status,
  items: cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: mapProduct(item.product),
  })),
});

const META_FEED_BRAND = process.env.META_FEED_BRAND || 'Espace Mariage';
const META_FEED_CURRENCY = process.env.META_FEED_CURRENCY || 'TND';
const META_FEED_SITE_URL = process.env.META_FEED_SITE_URL || 'https://espacemariages.com';

const trimTrailingSlashes = (value) => String(value || '').replace(/\/+$/, '');

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  try {
    return new URL(trimmed).toString();
  } catch {
    if (!baseUrl) {
      return trimmed;
    }
    try {
      return new URL(trimmed, `${trimTrailingSlashes(baseUrl)}/`).toString();
    } catch {
      return trimmed;
    }
  }
};

const stripHtml = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const csvEscape = (value) => {
  const normalized =
    value === null || value === undefined ? '' : String(value).replace(/\r?\n|\r/g, ' ');
  if (!/[",]/.test(normalized)) {
    return normalized;
  }
  return `"${normalized.replace(/"/g, '""')}"`;
};

const buildFeedCsv = (rows) => {
  const headers = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'category',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ];
  return lines.join('\n');
};

const buildMetaFeedHandler = async (req, res) => {
  const siteBaseUrl = trimTrailingSlashes(META_FEED_SITE_URL) || 'https://espacemariages.com';
  const currency = String(META_FEED_CURRENCY || 'TND').trim().toUpperCase();

  const products = await prisma.product.findMany({
    where: {
      status: { equals: 'active', mode: 'insensitive' },
    },
    include: {
      category: true,
      images: {
        orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const rows = products.map((product) => {
    const normalized = mapProduct(product);
    const primaryImage =
      normalized.images.find((item) => item.isPrimary)?.url ||
      normalized.images[0]?.url ||
      normalized.image;
    const description = stripHtml(normalized.shortDescription || normalized.description);
    const numericPrice = Number(normalized.price || 0);
    return {
      id: normalized.id,
      title: normalized.name,
      description,
      availability: 'in stock',
      condition: 'new',
      price: `${numericPrice.toFixed(2)} ${currency}`,
      link: `${siteBaseUrl}/product/${encodeURIComponent(normalized.slug)}`,
      image_link: toAbsoluteUrl(primaryImage, siteBaseUrl),
      brand: META_FEED_BRAND,
      category: product.category?.name || '',
    };
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(buildFeedCsv(rows));
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/meta/product-feed.csv', buildMetaFeedHandler);
app.get('/api/meta/product-feed.csv', buildMetaFeedHandler);

app.get('/api/categories', async (_req, res) => {
  // Vitrine publique : seules les categories actives sont exposees.
  // L'admin passe par /api/admin/categories, qui les renvoie toutes.
  const categories = await prisma.category.findMany({
    where: { isActive: true },
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
    where: { isActive: true, category: { isActive: true } },
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
    include: { product: { include: { category: true, images: true } } },
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

app.post('/api/inventory/login', (req, res) => {
  const { clientId, clientSecret } = req.body ?? {};
  if (!clientId || !clientSecret) {
    res.status(400).json({ error: 'clientId and clientSecret required' });
    return;
  }
  if (!INVENTORY_CLIENT_ID || !INVENTORY_CLIENT_SECRET) {
    res.status(503).json({ error: 'Inventory credentials are not configured' });
    return;
  }
  if (
    String(clientId) !== String(INVENTORY_CLIENT_ID) ||
    String(clientSecret) !== String(INVENTORY_CLIENT_SECRET)
  ) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({ token: signInventoryToken() });
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

const handleInventoryOrders = async (req, res) => {
  const {
    id,
    status,
    customerId,
    customerEmail,
    customerName,
    from,
    to,
    minTotal,
    maxTotal,
    limit,
    offset,
  } = req.query ?? {};

  const fromDate = parseDateParam(from);
  if (from && !fromDate) {
    res.status(400).json({ error: 'Invalid from date' });
    return;
  }
  const toDate = parseDateParam(to);
  if (to && !toDate) {
    res.status(400).json({ error: 'Invalid to date' });
    return;
  }

  const minTotalValue = parseNumberParam(minTotal);
  if (minTotal && minTotalValue === null) {
    res.status(400).json({ error: 'Invalid minTotal' });
    return;
  }
  const maxTotalValue = parseNumberParam(maxTotal);
  if (maxTotal && maxTotalValue === null) {
    res.status(400).json({ error: 'Invalid maxTotal' });
    return;
  }

  const takeValue = parseNumberParam(limit);
  const skipValue = parseNumberParam(offset);

  const where = {};
  if (id) {
    where.id = String(id);
  }
  if (status) {
    where.status = String(status);
  }
  if (customerId) {
    where.customerId = String(customerId);
  }
  if (customerEmail) {
    where.customerEmail = { contains: String(customerEmail), mode: 'insensitive' };
  }
  if (customerName) {
    where.customerName = { contains: String(customerName), mode: 'insensitive' };
  }
  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }
  if (minTotalValue !== null || maxTotalValue !== null) {
    where.total = {
      ...(minTotalValue !== null ? { gte: Math.trunc(minTotalValue) } : {}),
      ...(maxTotalValue !== null ? { lte: Math.trunc(maxTotalValue) } : {}),
    };
  }

  const take =
    takeValue && Number.isFinite(takeValue) && takeValue > 0
      ? Math.min(Math.trunc(takeValue), 1000)
      : undefined;
  const skip =
    skipValue && Number.isFinite(skipValue) && skipValue >= 0
      ? Math.trunc(skipValue)
      : undefined;

  const [count, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      ...(take ? { take } : {}),
      ...(skip ? { skip } : {}),
    }),
  ]);

  res.json({
    data: orders,
    meta: {
      count,
      limit: take ?? null,
      offset: skip ?? 0,
    },
  });
};

// Admin - Inventory: Orders (filtered)
app.get('/api/admin/inventory/orders', handleInventoryOrders);

// Inventory - Orders (filtered)
app.get('/api/inventory/orders', requireInventory, handleInventoryOrders);

const handleInventoryProducts = async (req, res) => {
  const {
    id,
    status,
    categoryId,
    categorySlug,
    q,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    featured,
    trending,
    includeEmpty,
  } = req.query ?? {};

  const createdFromDate = parseDateParam(createdFrom);
  if (createdFrom && !createdFromDate) {
    res.status(400).json({ error: 'Invalid createdFrom date' });
    return;
  }
  const createdToDate = parseDateParam(createdTo);
  if (createdTo && !createdToDate) {
    res.status(400).json({ error: 'Invalid createdTo date' });
    return;
  }
  const updatedFromDate = parseDateParam(updatedFrom);
  if (updatedFrom && !updatedFromDate) {
    res.status(400).json({ error: 'Invalid updatedFrom date' });
    return;
  }
  const updatedToDate = parseDateParam(updatedTo);
  if (updatedTo && !updatedToDate) {
    res.status(400).json({ error: 'Invalid updatedTo date' });
    return;
  }

  const featuredValue = parseBoolParam(featured);
  if (featured !== undefined && featured !== null && featured !== '' && featuredValue === null) {
    res.status(400).json({ error: 'Invalid featured value' });
    return;
  }
  const trendingValue = parseBoolParam(trending);
  if (trending !== undefined && trending !== null && trending !== '' && trendingValue === null) {
    res.status(400).json({ error: 'Invalid trending value' });
    return;
  }

  const categoryWhere = {};
  if (categoryId) {
    categoryWhere.id = String(categoryId);
  }
  if (categorySlug) {
    categoryWhere.slug = String(categorySlug);
  }

  const productWhere = {};
  if (id) {
    productWhere.id = String(id);
  }
  if (status) {
    productWhere.status = String(status);
  }
  if (categoryId) {
    productWhere.categoryId = String(categoryId);
  }
  if (featuredValue !== null) {
    productWhere.featured = featuredValue;
  }
  if (trendingValue !== null) {
    productWhere.trending = trendingValue;
  }
  if (createdFromDate || createdToDate) {
    productWhere.createdAt = {
      ...(createdFromDate ? { gte: createdFromDate } : {}),
      ...(createdToDate ? { lte: createdToDate } : {}),
    };
  }
  if (updatedFromDate || updatedToDate) {
    productWhere.updatedAt = {
      ...(updatedFromDate ? { gte: updatedFromDate } : {}),
      ...(updatedToDate ? { lte: updatedToDate } : {}),
    };
  }
  if (q) {
    productWhere.OR = [
      { name: { contains: String(q), mode: 'insensitive' } },
      { slug: { contains: String(q), mode: 'insensitive' } },
      { sku: { contains: String(q), mode: 'insensitive' } },
    ];
  }

  const includeEmptyCategories = parseBoolParam(includeEmpty) ?? false;

  const categories = await prisma.category.findMany({
    where: categoryWhere,
    orderBy: { name: 'asc' },
    include: {
      products: {
        where: productWhere,
        include: { images: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const data = includeEmptyCategories
    ? categories
    : categories.filter((category) => (category.products ?? []).length > 0);

  const productCount = data.reduce(
    (total, category) => total + (category.products?.length ?? 0),
    0
  );

  res.json({
    data,
    meta: {
      categories: data.length,
      products: productCount,
      includeEmpty: includeEmptyCategories,
    },
  });
};

// Admin - Inventory: Products grouped by category (filtered)
app.get('/api/admin/inventory/products', handleInventoryProducts);

// Inventory - Products grouped by category (filtered)
app.get('/api/inventory/products', requireInventory, handleInventoryProducts);

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

app.delete('/api/admin/orders/:id', async (req, res) => {
  try {
    const existing = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Delete failed' });
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
  try {
    const { name, slug, description, image, isActive } = req.body ?? {};
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug, description, image, isActive },
    });
    if (existing.image && existing.image !== category.image) {
      await purgeUnusedUploads([existing.image]);
    }
    res.json(category);
  } catch (error) {
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
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
    if (existing.image) {
      await purgeUnusedUploads([existing.image]);
    }
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
    images,
    optionLabel,
    optionValues,
    badge,
    rating,
    shortDescription,
    description,
    details,
    featured,
    trending,
    categoryId,
  } = req.body ?? {};

  const imageList = normalizeImageList(image, images);
  const primaryImage = imageList[0] ?? image;
  const normalizedOptionValues = normalizeOptionValues(optionValues);
  const normalizedOptionLabel =
    typeof optionLabel === 'string' && optionLabel.trim() ? optionLabel.trim() : null;

  if (normalizedOptionValues.length > 0 && !normalizedOptionLabel) {
    res.status(400).json({ error: 'optionLabel is required when optionValues are provided.' });
    return;
  }

  if (!slug || !name || price == null || !primaryImage || !description || !categoryId) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }

  const product = await prisma.product.create({
    data: {
      slug: normalizeSlug(slug),
      name,
      sku,
      price: Number(price),
      originalPrice: originalPrice == null ? null : Number(originalPrice),
      stock: stock ?? 0,
      status: status ?? 'active',
      image: primaryImage,
      badge,
      rating,
      shortDescription,
      description,
      details: Array.isArray(details) ? details : [],
      optionLabel: normalizedOptionLabel,
      optionValues: normalizedOptionValues.length ? normalizedOptionValues : null,
      featured: Boolean(featured),
      trending: Boolean(trending),
      categoryId,
    },
  });

  if (imageList.length) {
    await prisma.productImage.createMany({
      data: imageList.map((url, index) => ({
        productId: product.id,
        url,
        alt: name,
        isPrimary: url === primaryImage,
        position: index,
      })),
    });
  }

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
      images,
      optionLabel,
      optionValues,
      badge,
      rating,
      shortDescription,
      description,
      details,
      featured,
      trending,
      categoryId,
    } = req.body ?? {};

    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const imageList = images ? normalizeImageList(image, images) : null;
    if (images && imageList.length === 0) {
      res.status(400).json({ error: 'At least one image is required.' });
      return;
    }
    const primaryImage = imageList ? imageList[0] : image;
    const normalizedOptionValues = optionValues ? normalizeOptionValues(optionValues) : null;
    const normalizedOptionLabel =
      typeof optionLabel === 'string' && optionLabel.trim() ? optionLabel.trim() : null;
    if (normalizedOptionValues && normalizedOptionValues.length > 0 && !normalizedOptionLabel) {
      res.status(400).json({ error: 'optionLabel is required when optionValues are provided.' });
      return;
    }

    const data = {
      slug: normalizeSlug(slug),
      name,
      sku: sku ?? null,
      price: price != null ? Number(price) : undefined,
      originalPrice:
        originalPrice === '' || originalPrice == null ? null : Number(originalPrice),
      stock: stock != null ? Number(stock) : undefined,
      status,
      image: primaryImage ?? image,
      badge,
      rating: rating == null || rating === '' ? null : Number(rating),
      shortDescription,
      description,
      details: Array.isArray(details) ? details : [],
      optionLabel: normalizedOptionValues ? normalizedOptionLabel : undefined,
      optionValues: normalizedOptionValues ? (normalizedOptionValues.length ? normalizedOptionValues : null) : undefined,
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

    if (imageList) {
      await prisma.productImage.deleteMany({
        where: { productId: product.id },
      });
      if (imageList.length) {
        await prisma.productImage.createMany({
          data: imageList.map((url, index) => ({
            productId: product.id,
            url,
            alt: name ?? product.name,
            isPrimary: url === (primaryImage ?? product.image),
            position: index,
          })),
        });
      }
      const oldUrls = Array.from(
        new Set([existing.image, ...(existing.images ?? []).map((img) => img.url)].filter(Boolean))
      );
      const removed = oldUrls.filter((url) => !imageList.includes(url));
      if (removed.length) {
        await purgeUnusedUploads(removed);
      }
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { images: true },
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
    const urls = Array.from(
      new Set([product.image, ...(product.images ?? []).map((img) => img.url)].filter(Boolean))
    );
    if (urls.length) {
      await purgeUnusedUploads(urls);
    }
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
    include: { category: true, images: true },
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
    include: { category: true, images: true },
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
    (sum, item) => sum + Number(item.product.price) * item.quantity,
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

app.post('/api/orders/checkout', async (req, res) => {
  const { items, address, phone, notes, firstName, lastName, email } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0 || !address) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const authenticatedCustomer = await resolveCustomerFromAuthHeader(req);
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
  const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
  const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';

  if (!authenticatedCustomer) {
    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPhone) {
      res.status(400).json({ error: 'Missing guest checkout fields.' });
      return;
    }
    if (!normalizedEmail.includes('@')) {
      res.status(400).json({ error: 'Invalid email.' });
      return;
    }
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
    const allowedOptions = normalizeOptionValues(product.optionValues ?? []);
    const optionValue =
      typeof item.optionValue === 'string' ? item.optionValue.trim() : '';
    if (allowedOptions.length > 0) {
      if (!optionValue) {
        res.status(400).json({ error: 'Option selection required.' });
        return;
      }
      if (!allowedOptions.includes(optionValue)) {
        res.status(400).json({ error: 'Invalid option selection.' });
        return;
      }
    }
    total += Number(product.price) * quantity;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      optionLabel: product.optionLabel ?? null,
      optionValue: optionValue || null,
    });
  }

  let orderData;

  if (authenticatedCustomer) {
    const updatedCustomer = await prisma.customer.update({
      where: { id: authenticatedCustomer.id },
      data: {
        firstName: normalizedFirstName || authenticatedCustomer.firstName,
        lastName: normalizedLastName || authenticatedCustomer.lastName,
        phone: normalizedPhone || authenticatedCustomer.phone || null,
        address,
      },
    });

    orderData = {
      customerId: updatedCustomer.id,
      customerName: `${updatedCustomer.firstName} ${updatedCustomer.lastName}`.trim(),
      customerEmail: updatedCustomer.email,
      customerPhone: updatedCustomer.phone ?? '',
      shippingAddress: address,
      notes: notes ?? null,
      total,
      items: { create: orderItems },
    };
  } else {
    orderData = {
      customerName: `${normalizedFirstName} ${normalizedLastName}`.trim(),
      customerEmail: normalizedEmail,
      customerPhone: normalizedPhone,
      shippingAddress: address,
      notes: notes ?? null,
      total,
      items: { create: orderItems },
    };
  }

  const order = await prisma.order.create({
    data: orderData,
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
