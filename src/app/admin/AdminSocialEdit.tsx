import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminGet, adminPatch } from '../api/admin';
import type { SocialLink } from './types';

export const AdminSocialEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<SocialLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      try {
        const items = await adminGet('/api/admin/social-links');
        const found = items.find((entry: SocialLink) => entry.id === id) ?? null;
        setItem(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load link');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <p className="text-[#6B5D52]">Chargement...</p>;
  }

  if (!item) {
    return (
      <div>
        <p className="text-red-600">Lien introuvable.</p>
        <Link to="/admin/settings" className="text-[#B8936A]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">Modifier lien social</h2>
        <Link to="/admin/settings" className="text-[#B8936A]">Retour</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPatch(`/api/admin/social-links/${item.id}`, item);
          navigate('/admin/settings');
        }}
        className="space-y-3"
      >
        <input
          value={item.label}
          onChange={(event) => setItem({ ...item, label: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Label"
          required
        />
        <input
          value={item.url}
          onChange={(event) => setItem({ ...item, url: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="URL"
          required
        />
        <input
          value={item.iconKey}
          onChange={(event) => setItem({ ...item, iconKey: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Icon key"
          required
        />
        <input
          type="number"
          value={item.position}
          onChange={(event) => setItem({ ...item, position: Number(event.target.value) })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Position"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.isActive}
            onChange={(event) => setItem({ ...item, isActive: event.target.checked })}
          />
          Actif
        </label>
        <button className="bg-[#2C2520] text-white px-4 py-2">Enregistrer</button>
      </form>
    </div>
  );
};
