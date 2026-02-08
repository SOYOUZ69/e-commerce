import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminGet, clearAdminToken, getAdminToken } from '../api/admin';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const check = async () => {
      const token = getAdminToken();
      if (!token) {
        navigate('/admin/login');
        return;
      }
      try {
        const me = await adminGet('/api/admin/me');
        setAdminName(me.name ?? 'Admin');
      } catch {
        clearAdminToken();
        navigate('/admin/login');
        return;
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <p className="text-[#6B5D52]">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl text-[#2C2520]">Admin</h1>
            <p className="text-[#6B5D52]">Bienvenue, {adminName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="border border-[#B8936A] text-[#B8936A] px-4 py-2 hover:bg-[#B8936A] hover:text-white transition-colors"
            >
              Voir le site
            </Link>
            <button
              onClick={() => {
                clearAdminToken();
                navigate('/admin/login');
              }}
              className="bg-[#2C2520] text-white px-4 py-2 hover:bg-[#B8936A] transition-colors"
            >
              Deconnexion
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="bg-white rounded-2xl p-4 shadow-sm h-fit">
            <nav className="flex flex-col gap-2 text-[#2C2520]">
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'text-[#B8936A]' : '')}>
                Apercu
              </NavLink>
              <NavLink to="/admin/catalog" className={({ isActive }) => (isActive ? 'text-[#B8936A]' : '')}>
                Catalogue
              </NavLink>
              <NavLink to="/admin/home" className={({ isActive }) => (isActive ? 'text-[#B8936A]' : '')}>
                Page d'accueil
              </NavLink>
              <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'text-[#B8936A]' : '')}>
                Commandes
              </NavLink>
              <NavLink to="/admin/settings" className={({ isActive }) => (isActive ? 'text-[#B8936A]' : '')}>
                Parametres
              </NavLink>
            </nav>
          </aside>
          <main className="space-y-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
