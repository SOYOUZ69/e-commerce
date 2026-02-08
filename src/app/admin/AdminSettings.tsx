import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { adminDelete, adminGet, adminPost } from '../api/admin';
import { SectionCard } from './SectionCard';
import type { PaymentBadge, SiteSettings, SocialLink } from './types';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [paymentBadges, setPaymentBadges] = useState<PaymentBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [socialForm, setSocialForm] = useState({ label: '', url: '', iconKey: '', position: 0 });
  const [badgeForm, setBadgeForm] = useState({ label: '', imageUrl: '', position: 0 });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsData, socialData, badgesData] = await Promise.all([
        adminGet('/api/admin/settings'),
        adminGet('/api/admin/social-links'),
        adminGet('/api/admin/payment-badges'),
      ]);
      setSettings(settingsData ?? {});
      setSocialLinks(socialData);
      setPaymentBadges(badgesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-[#6B5D52]">Chargement des donnees...</p>}

      <SectionCard title="Parametres">
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[#6B5D52]">
              <tr>
                <th className="py-2">Logo</th>
                <th className="py-2">Contact</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#EEE2D2]">
                <td className="py-2 text-[#2C2520]">{settings.logoUrl ? 'Defini' : 'Vide'}</td>
                <td className="py-2 text-[#6B5D52]">{settings.contactEmail ?? '-'}</td>
                <td className="py-2 text-right">
                  <Link
                    to="/admin/settings/site"
                    className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                  >
                    <Pencil className="w-4 h-4" />
                    Modifier
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Liens sociaux">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await adminPost('/api/admin/social-links', {
                ...socialForm,
                position: Number(socialForm.position),
              });
              setSocialForm({ label: '', url: '', iconKey: '', position: 0 });
              refresh();
            }}
            className="space-y-3"
          >
            <input
              placeholder="Label"
              value={socialForm.label}
              onChange={(event) => setSocialForm((prev) => ({ ...prev, label: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="URL"
              value={socialForm.url}
              onChange={(event) => setSocialForm((prev) => ({ ...prev, url: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="Icon key"
              value={socialForm.iconKey}
              onChange={(event) => setSocialForm((prev) => ({ ...prev, iconKey: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Position"
              value={socialForm.position}
              onChange={(event) => setSocialForm((prev) => ({ ...prev, position: Number(event.target.value) }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Label</th>
                  <th className="py-2">URL</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {socialLinks.map((item) => (
                  <tr key={item.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{item.label}</td>
                    <td className="py-2 text-[#6B5D52]">{item.url}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/settings/social-links/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        onClick={async () => {
                          await adminDelete(`/api/admin/social-links/${item.id}`);
                          refresh();
                        }}
                        className="ml-4 text-sm text-red-600"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Badges paiement">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await adminPost('/api/admin/payment-badges', {
                ...badgeForm,
                position: Number(badgeForm.position),
              });
              setBadgeForm({ label: '', imageUrl: '', position: 0 });
              refresh();
            }}
            className="space-y-3"
          >
            <input
              placeholder="Label"
              value={badgeForm.label}
              onChange={(event) => setBadgeForm((prev) => ({ ...prev, label: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="Image URL"
              value={badgeForm.imageUrl}
              onChange={(event) => setBadgeForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Position"
              value={badgeForm.position}
              onChange={(event) => setBadgeForm((prev) => ({ ...prev, position: Number(event.target.value) }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Label</th>
                  <th className="py-2">Image</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentBadges.map((item) => (
                  <tr key={item.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{item.label}</td>
                    <td className="py-2 text-[#6B5D52]">{item.imageUrl}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/settings/payment-badges/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        onClick={async () => {
                          await adminDelete(`/api/admin/payment-badges/${item.id}`);
                          refresh();
                        }}
                        className="ml-4 text-sm text-red-600"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
