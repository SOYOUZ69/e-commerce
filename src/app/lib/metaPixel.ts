import type { Product } from '../types';
import { META_CURRENCY } from './site';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _metaPixelInitialized?: boolean;
    _metaLastPageViewPath?: string;
  }
}

const META_PIXEL_ID = String(import.meta.env.VITE_META_PIXEL_ID || '').trim();

export const initializeMetaPixel = () => {
  if (typeof window === 'undefined' || !META_PIXEL_ID) {
    return false;
  }
  if (window._metaPixelInitialized) {
    return true;
  }
  if (typeof window.fbq !== 'function') {
    return false;
  }
  window._metaPixelInitialized = true;
  return true;
};

const track = (eventName: string, params?: Record<string, any>) => {
  if (!initializeMetaPixel()) {
    return;
  }
  if (params) {
    window.fbq?.('track', eventName, params);
    return;
  }
  window.fbq?.('track', eventName);
};

const mapProductPayload = (product: Product) => ({
  id: product.id,
  name: product.name,
  price: Number(product.price || 0),
  quantity: 1,
});

const mapContents = (products: Array<{ id: string; quantity?: number; price?: number }>) =>
  products.map((item) => ({
    id: item.id,
    quantity: Number(item.quantity || 1),
    item_price: Number(item.price || 0),
  }));

export const trackPageView = () => {
  track('PageView');
};

export const trackViewContent = (product: Product) => {
  const content = mapProductPayload(product);
  track('ViewContent', {
    content_type: 'product',
    content_ids: [content.id],
    contents: [
      {
        id: content.id,
        quantity: 1,
        item_price: content.price,
      },
    ],
    content_name: content.name,
    value: content.price,
    currency: META_CURRENCY,
  });
};

export const trackAddToCart = (product: Product, quantity = 1) => {
  const content = mapProductPayload(product);
  const qty = Number(quantity || 1);
  track('AddToCart', {
    content_type: 'product',
    content_ids: [content.id],
    contents: [
      {
        id: content.id,
        quantity: qty,
        item_price: content.price,
      },
    ],
    content_name: content.name,
    value: content.price * qty,
    currency: META_CURRENCY,
  });
};

export const trackInitiateCheckout = (
  items: Array<{ product: Product; quantity: number }>,
  total: number
) => {
  track('InitiateCheckout', {
    content_type: 'product',
    content_ids: items.map((item) => item.product.id),
    contents: mapContents(
      items.map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }))
    ),
    num_items: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    value: Number(total || 0),
    currency: META_CURRENCY,
  });
};

export const trackPurchase = (payload: {
  orderId?: string;
  items: Array<{ id: string; quantity: number; price: number }>;
  total: number;
}) => {
  track('Purchase', {
    content_type: 'product',
    content_ids: payload.items.map((item) => item.id),
    contents: mapContents(payload.items),
    num_items: payload.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    value: Number(payload.total || 0),
    currency: META_CURRENCY,
    ...(payload.orderId ? { order_id: payload.orderId } : {}),
  });
};
