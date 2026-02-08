import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminGet, adminPatch, adminUpload } from '../api/admin';
import type { PromoBanner } from './types';

export const AdminPromoEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState<PromoBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      try {
        const promos = await adminGet('/api/admin/promo-banners');
        const found = promos.find((item: PromoBanner) => item.id === id) ?? null;
        setPromo(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load promo');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <p className="text-[#6B5D52]">Chargement...</p>;
  }

  if (!promo) {
    return (
      <div>
        <p className="text-red-600">Promo introuvable.</p>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">Modifier Promo</h2>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPatch(`/api/admin/promo-banners/${promo.id}`, promo);
          navigate('/admin/home');
        }}
        className="space-y-3"
      >
        <input
          value={promo.title}
          onChange={(event) => setPromo({ ...promo, title: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Titre"
          required
        />
        <input
          value={promo.subtitle ?? ''}
          onChange={(event) => setPromo({ ...promo, subtitle: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Sous-titre"
        />
        <input
          value={promo.ctaLabel ?? ''}
          onChange={(event) => setPromo({ ...promo, ctaLabel: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="CTA Label"
        />
        <input
          value={promo.ctaUrl ?? ''}
          onChange={(event) => setPromo({ ...promo, ctaUrl: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="CTA URL"
        />
        <div className="space-y-2">
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
                setPromo({ ...promo, imageUrl: data.url });
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
              } finally {
                setUploading(false);
              }
            }}
            className="w-full border border-[#B8936A] px-3 py-2"
          />
          {promo.imageUrl && <img src={promo.imageUrl} alt="Promo" className="h-24 rounded" />}
          {uploading && <p className="text-sm text-[#6B5D52]">Upload en cours...</p>}
        </div>
        <input
          value={promo.themeColor ?? ''}
          onChange={(event) => setPromo({ ...promo, themeColor: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Theme color"
        />
        <input
          type="number"
          value={promo.position}
          onChange={(event) => setPromo({ ...promo, position: Number(event.target.value) })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Position"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={promo.isActive}
            onChange={(event) => setPromo({ ...promo, isActive: event.target.checked })}
          />
          Actif
        </label>
        <button className="bg-[#2C2520] text-white px-4 py-2">Enregistrer</button>
      </form>
    </div>
  );
};
