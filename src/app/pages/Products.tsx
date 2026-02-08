import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../store/catalog';

export const Products = () => {
  const { products, categories, loading, error } = useCatalog();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (!categoryParam) {
      setActiveCategory('All');
      return;
    }
    const match = categories.find(
      (category) =>
        category.slug === categoryParam || category.name.toLowerCase() === categoryParam.toLowerCase()
    );
    if (match) {
      setActiveCategory(match.name);
    } else {
      setActiveCategory('All');
    }
  }, [categories, searchParams]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') {
      return products;
    }
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl text-[#2C2520] mb-4">Shop the Collection</h1>
          <p className="text-[#6B5D52] max-w-2xl mx-auto">
            Curated essentials designed for elevated everyday living. Filter by category
            to find the perfect piece.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {['All', ...categories.map((category) => category.name)].map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                if (category === 'All') {
                  setSearchParams({});
                  return;
                }
                const match = categories.find((item) => item.name === category);
                setSearchParams({ category: match?.slug ?? category });
              }}
              className={`px-5 py-2 border transition-colors ${
                activeCategory === category
                  ? 'bg-[#2C2520] text-white border-[#2C2520]'
                  : 'bg-white text-[#2C2520] border-[#B8936A] hover:bg-[#B8936A] hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && <p className="text-[#6B5D52]">Loading products...</p>}
          {error && <p className="text-[#B8936A]">{error}</p>}
          {!loading &&
            !error &&
            filtered.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
};
