import { useEffect, useState } from 'react';
import { fetchJson } from '../api/client';

type Promo = {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  themeColor?: string | null;
};

const defaultPromos: Promo[] = [
  {
    id: 'default-1',
    title: 'Collection Bijoux',
    subtitle: 'Jusqu’à -40 %',
    ctaLabel: 'Découvrir',
    ctaUrl: '/products',
    imageUrl:
      'https://images.unsplash.com/photo-1758995115475-7b7d6eb060ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBqZXdlbHJ5JTIwZ29sZHxlbnwxfHx8fDE3NjY4NTIzNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 'default-2',
    title: 'Collection Horlogerie',
    subtitle: 'Nouveautés',
    ctaLabel: 'Voir la sélection',
    ctaUrl: '/products',
    imageUrl:
      'https://images.unsplash.com/photo-1760532466974-f969f56dfcc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwd2F0Y2glMjBwcmVtaXVtfGVufDF8fHx8MTc2NjkzOTk5NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
];

export function PromoBanners() {
  const [promos, setPromos] = useState<Promo[]>(defaultPromos);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchJson('/api/home/promos');
        setPromos(items.length ? items : defaultPromos);
      } catch {
        setPromos(defaultPromos);
      }
    };
    load();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          {promos.map((promo) => (
            <div key={promo.id} className="relative overflow-hidden rounded-lg group cursor-pointer">
              <div className="aspect-[4/3]">
                <img
                  src={promo.imageUrl ?? ''}
                  alt={promo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                {promo.subtitle && (
                  <span className="text-[#C9A978] text-sm tracking-widest uppercase mb-2">
                    {promo.subtitle}
                  </span>
                )}
                <h3 className="text-white text-3xl mb-3">{promo.title}</h3>
                {promo.ctaLabel && (
                  <a
                    href={promo.ctaUrl ?? '/products'}
                    className="bg-white text-[#2C2520] px-6 py-2 w-fit hover:bg-[#B8936A] hover:text-white transition-colors"
                  >
                    {promo.ctaLabel}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
