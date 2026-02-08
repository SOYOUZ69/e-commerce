import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/auth';

export const AccountRegister = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('returnTo') ?? '/checkout';

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h1 className="text-3xl text-[#2C2520] mb-2">Créer un compte</h1>
          <p className="text-[#6B5D52] mb-6">
            Créez votre compte pour finaliser votre commande.
          </p>
          {error && <p className="text-red-600 mb-3">{error}</p>}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                await register({
                  firstName: form.firstName,
                  lastName: form.lastName,
                  email: form.email,
                  password: form.password,
                  phone: form.phone || undefined,
                });
                navigate(returnTo);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Register failed');
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <input
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder="Prénom"
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder="Nom"
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Téléphone"
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Mot de passe"
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <button
              className="w-full bg-[#2C2520] text-white px-4 py-2"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer un compte'}
            </button>
          </form>
          <p className="text-sm text-[#6B5D52] mt-4">
            Déjà un compte ?{' '}
            <Link
              to={`/account/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="text-[#B8936A]"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
