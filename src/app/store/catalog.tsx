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

const mapProduct = (product: Product) => {
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage =
    product.image ||
    images.find((item) => item.isPrimary)?.url ||
    images[0]?.url ||
    '';
  const optionValues = Array.isArray(product.optionValues)
    ? product.optionValues.filter((value) => typeof value === 'string' && value.trim())
    : [];
  return {
    ...product,
    slug: typeof product.slug === 'string' ? product.slug.trim() : product.slug,
    details: Array.isArray(product.details) ? product.details : [],
    image: primaryImage,
    images,
    optionLabel: product.optionLabel ?? null,
    optionValues,
  };
};

export const CatalogProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `silent` : rafraichissement en arriere-plan, sans repasser par l'etat de
  // chargement — sinon la page clignoterait a chaque retour sur l'onglet.
  const refresh = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchJson('/api/products'),
        fetchJson('/api/categories'),
      ]);
      setProducts(productsData.map(mapProduct));
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le catalogue.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    // Le catalogue etait charge une seule fois au demarrage : un onglet laisse
    // ouvert ne voyait jamais les produits ajoutes depuis l'admin, y compris
    // dans la recherche du header qui lit cette meme liste. On le rafraichit
    // donc quand l'onglet redevient visible ou reprend le focus.
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh(true);
      }
    };

    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
    };
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
