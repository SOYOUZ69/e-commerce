import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../api/client';
import { useCatalog } from '../store/catalog';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

export function FeaturedProducts() {
  const { products, loading } = useCatalog();
  const [featuredItems, setFeaturedItems] = useState<Product[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setHomeLoading(true);
      setHomeError(null);
      try {
        const items = await fetchJson('/api/home/products?type=featured');
        const mapped = Array.isArray(items)
          ? items.map((item) => item.product).filter(Boolean)
          : [];
        setFeaturedItems(mapped);
      } catch (err) {
        setHomeError(err instanceof Error ? err.message : 'Impossible de charger la sélection.');
      } finally {
        setHomeLoading(false);
      }
    };
    load();
  }, []);

  const fallback = useMemo(
    () => products.filter((product) => product.featured),
    [products]
  );
  const featured = featuredItems.length > 0 ? featuredItems : fallback;
  const isLoading = loading || homeLoading;

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-[#2C2520] mb-4">Sélection exclusive</h2>
          <p className="text-[#6B5D52] max-w-2xl mx-auto">
            Découvrez notre sélection de pièces d’exception, choisies avec soin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading && <p className="text-[#6B5D52]">Chargement des produits...</p>}
          {!isLoading && featured.length === 0 && (
            <p className="text-[#6B5D52]">
              Aucun produit mis en avant pour le moment.
            </p>
          )}
          {!isLoading &&
            featured.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <div className="text-center">
          <Link
            to="/products"
            className="border-2 border-[#B8936A] text-[#B8936A] px-8 py-3 hover:bg-[#B8936A] hover:text-white transition-colors inline-block"
          >
            Voir toute la collection
          </Link>
          {homeError && featuredItems.length === 0 && (
            <p className="text-xs text-[#6B5D52] mt-3">({homeError})</p>
          )}
        </div>
      </div>
    </section>
  );
}
