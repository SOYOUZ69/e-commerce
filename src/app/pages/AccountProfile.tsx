import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerUpdateProfile } from '../api/auth';
import { useAuth } from '../store/auth';

export const AccountProfile = () => {
  const navigate = useNavigate();
  const { customer, loading, refresh } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !customer) {
      navigate('/account/login?returnTo=/account/profile');
    }
  }, [customer, loading, navigate]);

  useEffect(() => {
    if (customer) {
      setForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone ?? '',
        address: customer.address ?? '',
      });
    }
  }, [customer]);

  if (!customer && !loading) {
    return null;
  }

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl text-[#2C2520]">Profil client</h1>
            <Link to="/account/orders" className="text-[#B8936A]">
              Mes commandes
            </Link>
          </div>
          <p className="text-[#6B5D52] mb-6">
            Mettez à jour vos informations et votre adresse.
          </p>
          {error && <p className="text-red-600 mb-3">{error}</p>}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setError(null);
              try {
                await customerUpdateProfile({
                  firstName: form.firstName,
                  lastName: form.lastName,
                  phone: form.phone || undefined,
                  address: form.address || undefined,
                });
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Mise à jour impossible.');
              } finally {
                setSaving(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={form.firstName}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                placeholder="Prénom"
                className="border border-[#B8936A] px-3 py-2"
                required
              />
              <input
                value={form.lastName}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                placeholder="Nom"
                className="border border-[#B8936A] px-3 py-2"
                required
              />
            </div>
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Téléphone"
              className="border border-[#B8936A] px-3 py-2 w-full"
            />
            <textarea
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Adresse"
              className="border border-[#B8936A] px-3 py-2 w-full min-h-[120px]"
            />
            <button className="bg-[#2C2520] text-white px-4 py-2" disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
