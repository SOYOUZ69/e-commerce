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

export function Hero() {
  const [hero, setHero] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJson('/api/home/hero');
        const isActive = data?.isActive !== false;
        const hasContent = Boolean(
          data?.title ||
            data?.subtitle ||
            data?.ctaLabel ||
            data?.ctaUrl ||
            data?.imageUrl ||
            data?.badgeText
        );
        if (data && isActive && hasContent) {
          setHero(data);
        } else {
          setHero(null);
        }
      } catch {
        setHero(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !hero) {
    return null;
  }

  const imageSrc = hero.imageUrl ?? null;
  const showCta = Boolean(hero.ctaLabel && hero.ctaUrl);

  return (
    <section className="relative bg-[#FAF8F3] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-32">
          {/* Left Content */}
          <div className="space-y-6">
            {hero.badgeText && (
              <div className="inline-block">
                <span className="text-[#B8936A] tracking-widest uppercase text-sm">
                  {hero.badgeText}
                </span>
              </div>
            )}
            {hero.title && (
              <h1 className="text-5xl lg:text-6xl xl:text-7xl text-[#2C2520]">
                {hero.title}
              </h1>
            )}
            {hero.subtitle && (
              <p className="text-lg text-[#6B5D52] max-w-md">
                {hero.subtitle}
              </p>
            )}
            {showCta && (
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href={hero.ctaUrl ?? '#'}
                  className="bg-[#B8936A] text-white px-8 py-3 hover:bg-[#A67C52] transition-colors"
                >
                  {hero.ctaLabel}
                </a>
              </div>
            )}
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-[#EFE7DA]">
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt="Visuel principal"
                  className="w-full h-full object-cover"
                />
              )}
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
