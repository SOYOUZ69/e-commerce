import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { trackAddToCart } from '../lib/metaPixel';
import type { Product } from '../types';
import { useCatalog } from './catalog';

type RawCartItem = {
  key: string;
  productId: string;
  quantity: number;
  optionLabel?: string | null;
  optionValue?: string | null;
};

type CartItem = {
  key: string;
  product: Product;
  quantity: number;
  optionLabel?: string | null;
  optionValue?: string | null;
};

const STORAGE_KEY = 'reflet-cart';
const buildKey = (productId: string, optionValue?: string | null) =>
  `${productId}::${optionValue ?? ''}`;

const CartContext = createContext<{
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  addItem: (
    product: Product,
    quantity?: number,
    options?: { optionLabel?: string | null; optionValue?: string | null }
  ) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
} | null>(null);

const readCart = (): RawCartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as RawCartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => ({
      ...item,
      key: item.key || buildKey(item.productId, item.optionValue),
    }));
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { products } = useCatalog();
  const [rawItems, setRawItems] = useState<RawCartItem[]>(() => readCart());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawItems));
    }
  }, [rawItems]);

  useEffect(() => {
    if (!products.length) {
      return;
    }
    const validIds = new Set(products.map((product) => product.id));
    const filtered = rawItems.filter((item) => validIds.has(item.productId));
    if (filtered.length !== rawItems.length) {
      setRawItems(filtered);
    }
  }, [products, rawItems]);

  const items = useMemo(
    () =>
      rawItems
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) {
            return null;
          }
          return {
            key: item.key,
            product,
            quantity: item.quantity,
            optionLabel: item.optionLabel ?? null,
            optionValue: item.optionValue ?? null,
          } as CartItem;
        })
        .filter(Boolean) as CartItem[],
    [rawItems, products]
  );

  const addItem = (
    product: Product,
    quantity = 1,
    options?: { optionLabel?: string | null; optionValue?: string | null }
  ) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const key = buildKey(product.id, options?.optionValue);
    setRawItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + safeQuantity }
            : item
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          quantity: safeQuantity,
          optionLabel: options?.optionLabel ?? null,
          optionValue: options?.optionValue ?? null,
        },
      ];
    });
    trackAddToCart(product, safeQuantity);
  };

  const updateQuantity = (key: string, quantity: number) => {
    setRawItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.key !== key);
      }
      return prev.map((item) =>
        item.key === key ? { ...item, quantity } : item
      );
    });
  };

  const removeItem = (key: string) => {
    setRawItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clear = () => {
    setRawItems([]);
  };

  const cartCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      cartCount,
      subtotal,
      loading: false,
      error: null,
      addItem,
      removeItem,
      updateQuantity,
      clear,
    }),
    [items, cartCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
