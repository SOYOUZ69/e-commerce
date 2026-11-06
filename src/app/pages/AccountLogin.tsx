import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/auth';

export const AccountLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('returnTo') ?? '/checkout';

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h1 className="text-3xl text-[#2C2520] mb-2">Connexion</h1>
          <p className="text-[#6B5D52] mb-6">
            Connectez-vous pour finaliser votre commande.
          </p>
          {error && <p className="text-red-600 mb-3">{error}</p>}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                await login(email, password);
                navigate(returnTo);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Connexion impossible.');
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Adresse e-mail"
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <button
              className="w-full bg-[#2C2520] text-white px-4 py-2"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-sm text-[#6B5D52] mt-4">
            Pas encore de compte ?{' '}
            <Link
              to={`/account/register?returnTo=${encodeURIComponent(returnTo)}`}
              className="text-[#B8936A]"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
