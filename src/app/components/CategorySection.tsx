import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../api/client';

type HomeCategory = {
  id: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
  } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
};

export function CategorySection() {
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [fallbackCategories, setFallbackCategories] = useState<Category[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchJson('/api/home/categories');
        setCategories(items);
        if (!items.length) {
          const allCategories = await fetchJson('/api/categories');
          setFallbackCategories(allCategories);
        }
      } catch {
        const allCategories = await fetchJson('/api/categories');
        setFallbackCategories(allCategories);
      }
    };
    load();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-[#2C2520] mb-4">Explorez par univers</h2>
          <p className="text-[#6B5D52] max-w-2xl mx-auto">
            Parcourez nos catégories soigneusement sélectionnées et trouvez la pièce qui vous ressemble.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.length > 0 &&
            categories.map((item) => (
              <Link
                key={item.id}
                to={`/products?category=${item.category?.slug ?? ''}`}
                className="group relative overflow-hidden rounded-lg"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={item.category?.image ?? ''}
                    alt={item.category?.name ?? 'Catégorie'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-white text-2xl mb-1">{item.category?.name}</h3>
                </div>
                <div className="absolute inset-0 bg-[#B8936A]/0 group-hover:bg-[#B8936A]/20 transition-colors duration-300"></div>
              </Link>
            ))}
          {categories.length === 0 &&
            fallbackCategories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="group relative overflow-hidden rounded-lg"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={category.image ?? ''}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-white text-2xl mb-1">{category.name}</h3>
                </div>
                <div className="absolute inset-0 bg-[#B8936A]/0 group-hover:bg-[#B8936A]/20 transition-colors duration-300"></div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
