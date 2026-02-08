import { useEffect, useState } from 'react';
import { fetchJson } from '../api/client';

type HeroData = {
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  badgeText?: string | null;
  isActive?: boolean;
};

const defaultHero: HeroData = {
  title: 'Discover Luxury & Elegance',
  subtitle:
    '',
  ctaLabel: 'Shop Now',
  ctaUrl: '/products',
  imageUrl:
    'https://images.unsplash.com/photo-1622080157653-830e675f14c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxwcmVtaXVtJTIwZmFzaGlvbiUyMG1vZGVsfGVufDF8fHx8MTc2NjkzOTk5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  badgeText: 'New Collection 2025',
};

export function Hero() {
  const [hero, setHero] = useState<HeroData>(defaultHero);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJson('/api/home/hero');
        if (data && data.isActive !== false) {
          setHero({ ...defaultHero, ...data });
        }
      } catch {
        setHero(defaultHero);
      }
    };
    load();
  }, []);

  return (
    <section className="relative bg-[#FAF8F3] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-32">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-block">
              <span className="text-[#B8936A] tracking-widest uppercase text-sm">
                {hero.badgeText ?? defaultHero.badgeText}
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl text-[#2C2520]">
              {hero.title ?? defaultHero.title}
            </h1>
            <p className="text-lg text-[#6B5D52] max-w-md">
              {hero.subtitle ?? defaultHero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href={hero.ctaUrl ?? defaultHero.ctaUrl}
                className="bg-[#B8936A] text-white px-8 py-3 hover:bg-[#A67C52] transition-colors"
              >
                {hero.ctaLabel ?? defaultHero.ctaLabel}
              </a>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src={hero.imageUrl ?? defaultHero.imageUrl}
                alt="Hero"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Element */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#B8936A] rounded-full opacity-20 -z-10"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#C9A978] rounded-full opacity-20 -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
