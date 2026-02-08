import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminGet, adminPut, adminUpload } from '../api/admin';
import type { HeroSection } from './types';

export const AdminHeroEdit = () => {
  const navigate = useNavigate();
  const [hero, setHero] = useState<HeroSection>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const heroData = await adminGet('/api/admin/hero');
        setHero(heroData ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hero');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-[#6B5D52]">Chargement...</p>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">Modifier Hero</h2>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPut('/api/admin/hero', hero);
          navigate('/admin/home');
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          placeholder="Titre"
          value={hero.title ?? ''}
          onChange={(event) => setHero((prev) => ({ ...prev, title: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <input
          placeholder="Badge"
          value={hero.badgeText ?? ''}
          onChange={(event) => setHero((prev) => ({ ...prev, badgeText: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <input
          placeholder="CTA Label"
          value={hero.ctaLabel ?? ''}
          onChange={(event) => setHero((prev) => ({ ...prev, ctaLabel: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <input
          placeholder="CTA URL"
          value={hero.ctaUrl ?? ''}
          onChange={(event) => setHero((prev) => ({ ...prev, ctaUrl: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <div className="space-y-2 md:col-span-2">
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              try {
                setUploading(true);
                const data = await adminUpload(file);
                setHero((prev) => ({ ...prev, imageUrl: data.url }));
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
              } finally {
                setUploading(false);
              }
            }}
            className="border border-[#B8936A] px-3 py-2 w-full"
          />
          {hero.imageUrl && <img src={hero.imageUrl} alt="Hero" className="h-24 rounded" />}
          {uploading && <p className="text-sm text-[#6B5D52]">Upload en cours...</p>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(hero.isActive)}
            onChange={(event) => setHero((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          Actif
        </label>
        <textarea
          placeholder="Sous-titre"
          value={hero.subtitle ?? ''}
          onChange={(event) => setHero((prev) => ({ ...prev, subtitle: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2 md:col-span-2"
        />
        <button className="bg-[#2C2520] text-white px-4 py-2 md:col-span-2">
          Enregistrer
        </button>
      </form>
    </div>
  );
};
