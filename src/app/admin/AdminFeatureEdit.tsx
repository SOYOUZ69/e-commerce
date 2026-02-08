import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminGet, adminPatch } from '../api/admin';
import type { FeatureItem } from './types';

export const AdminFeatureEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feature, setFeature] = useState<FeatureItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      try {
        const features = await adminGet('/api/admin/features');
        const found = features.find((item: FeatureItem) => item.id === id) ?? null;
        setFeature(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <p className="text-[#6B5D52]">Chargement...</p>;
  }

  if (!feature) {
    return (
      <div>
        <p className="text-red-600">Feature introuvable.</p>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">Modifier Feature</h2>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPatch(`/api/admin/features/${feature.id}`, feature);
          navigate('/admin/home');
        }}
        className="space-y-3"
      >
        <input
          value={feature.title}
          onChange={(event) => setFeature({ ...feature, title: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Titre"
          required
        />
        <input
          value={feature.iconKey ?? ''}
          onChange={(event) => setFeature({ ...feature, iconKey: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Icon key"
        />
        <textarea
          value={feature.description}
          onChange={(event) => setFeature({ ...feature, description: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Description"
          required
        />
        <input
          type="number"
          value={feature.position}
          onChange={(event) => setFeature({ ...feature, position: Number(event.target.value) })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Position"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={feature.isActive}
            onChange={(event) => setFeature({ ...feature, isActive: event.target.checked })}
          />
          Actif
        </label>
        <button className="bg-[#2C2520] text-white px-4 py-2">Enregistrer</button>
      </form>
    </div>
  );
};
