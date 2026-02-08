import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminGet, adminPut } from '../api/admin';
import type { SiteSettings } from './types';

export const AdminSiteSettingsEdit = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminGet('/api/admin/settings');
        setSettings(data ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
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
        <h2 className="text-2xl text-[#2C2520]">Modifier parametres</h2>
        <Link to="/admin/settings" className="text-[#B8936A]">Retour</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPut('/api/admin/settings', settings);
          navigate('/admin/settings');
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          placeholder="Logo URL"
          value={settings.logoUrl ?? ''}
          onChange={(event) => setSettings((prev) => ({ ...prev, logoUrl: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <input
          placeholder="Email contact"
          value={settings.contactEmail ?? ''}
          onChange={(event) => setSettings((prev) => ({ ...prev, contactEmail: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <input
          placeholder="Telephone"
          value={settings.contactPhone ?? ''}
          onChange={(event) => setSettings((prev) => ({ ...prev, contactPhone: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <input
          placeholder="Adresse"
          value={settings.address ?? ''}
          onChange={(event) => setSettings((prev) => ({ ...prev, address: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2"
        />
        <textarea
          placeholder="Announcement"
          value={settings.announcementText ?? ''}
          onChange={(event) => setSettings((prev) => ({ ...prev, announcementText: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2 md:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(settings.announcementEnabled)}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, announcementEnabled: event.target.checked }))
            }
          />
          Announcement actif
        </label>
        <textarea
          placeholder="Newsletter"
          value={settings.newsletterText ?? ''}
          onChange={(event) => setSettings((prev) => ({ ...prev, newsletterText: event.target.value }))}
          className="border border-[#B8936A] px-3 py-2 md:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(settings.newsletterEnabled)}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, newsletterEnabled: event.target.checked }))
            }
          />
          Newsletter active
        </label>
        <button className="bg-[#2C2520] text-white px-4 py-2 md:col-span-2">Enregistrer</button>
      </form>
    </div>
  );
};
