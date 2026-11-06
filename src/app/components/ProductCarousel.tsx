import { useEffect, useMemo, useRef, useState } from 'react';
import Slider from 'react-slick';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchJson } from '../api/client';
import { ProductCard } from './ProductCard';
import { useCatalog } from '../store/catalog';
import type { Product } from '../types';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export function ProductCarousel() {
  const sliderRef = useRef<any>(null);

  const { products } = useCatalog();
  const [trendingItems, setTrendingItems] = useState<Product[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setHomeLoading(true);
      setHomeError(null);
      try {
        const items = await fetchJson('/api/home/products?type=trending');
        const mapped = Array.isArray(items)
          ? items.map((item) => item.product).filter(Boolean)
          : [];
        setTrendingItems(mapped);
      } catch (err) {
        setHomeError(err instanceof Error ? err.message : 'Impossible de charger les tendances.');
      } finally {
        setHomeLoading(false);
      }
    };
    load();
  }, []);

  const fallback = useMemo(
    () => products.filter((product) => product.trending),
    [products]
  );
  const trending = trendingItems.length > 0 ? trendingItems : fallback;

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl text-[#2C2520] mb-2">Tendances du moment</h2>
            <p className="text-[#6B5D52]">Les pièces les plus désirées de la saison</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => sliderRef.current?.slickPrev()}
              disabled={trending.length === 0}
              className="bg-[#FAF8F3] p-3 rounded-full hover:bg-[#B8936A] hover:text-white transition-colors text-[#2C2520]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => sliderRef.current?.slickNext()}
              disabled={trending.length === 0}
              className="bg-[#FAF8F3] p-3 rounded-full hover:bg-[#B8936A] hover:text-white transition-colors text-[#2C2520]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {homeLoading && <p className="text-[#6B5D52]">Chargement des produits...</p>}
        {!homeLoading && trending.length === 0 && (
          <p className="text-[#6B5D52]">
            Aucun produit tendance pour le moment.
          </p>
        )}
        {!homeLoading && trending.length > 0 && (
          <Slider ref={sliderRef} {...settings} className="product-carousel">
            {trending.map((product) => (
              <div key={product.id} className="px-3">
                <ProductCard product={product} />
              </div>
            ))}
          </Slider>
        )}
        {homeError && trendingItems.length === 0 && (
          <p className="text-xs text-[#6B5D52] mt-3">({homeError})</p>
        )}
      </div>
    </section>
  );
}
