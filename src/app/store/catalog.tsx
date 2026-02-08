import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../api/client';
import type { Category, Product } from '../types';

const CatalogContext = createContext<{
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getProductBySlug: (slug: string) => Product | undefined;
  fetchProductBySlug: (slug: string) => Promise<Product | undefined>;
} | null>(null);

const mapProduct = (product: Product) => ({
  ...product,
  slug: typeof product.slug === 'string' ? product.slug.trim() : product.slug,
  details: Array.isArray(product.details) ? product.details : [],
});

export const CatalogProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchJson('/api/products'),
        fetchJson('/api/categories'),
      ]);
      setProducts(productsData.map(mapProduct));
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const getProductBySlug = (slug: string) =>
    products.find((product) => product.slug === slug);

  const fetchProductBySlug = async (slug: string) => {
    try {
      const product = mapProduct(await fetchJson(`/api/products/${slug}`));
      setProducts((prev) => {
        const exists = prev.some((item) => item.slug === product.slug);
        return exists ? prev : [...prev, product];
      });
      return product;
    } catch {
      return undefined;
    }
  };

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      refresh,
      getProductBySlug,
      fetchProductBySlug,
    }),
    [products, categories, loading, error]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return context;
};
