import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '../types';
import { useCatalog } from './catalog';

type RawCartItem = {
  productId: string;
  quantity: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const STORAGE_KEY = 'reflet-cart';

const CartContext = createContext<{
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
    return Array.isArray(parsed) ? parsed : [];
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
          return { product, quantity: item.quantity } as CartItem;
        })
        .filter(Boolean) as CartItem[],
    [rawItems, products]
  );

  const addItem = (product: Product, quantity = 1) => {
    setRawItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product.id, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setRawItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeItem = (productId: string) => {
    setRawItems((prev) => prev.filter((item) => item.productId !== productId));
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
