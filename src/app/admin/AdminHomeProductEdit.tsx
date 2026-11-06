import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminGet, adminPatch } from '../api/admin';
import type { HomeProduct, Product } from './types';

export const AdminHomeProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<HomeProduct | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      try {
        const [items, productsData] = await Promise.all([
          adminGet('/api/admin/home-products'),
          adminGet('/api/admin/products'),
        ]);
        const found = items.find((entry: HomeProduct) => entry.id === id) ?? null;
        setItem(found);
        setProducts(productsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
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
        <p className="text-red-600">Element introuvable.</p>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">
          Modifier produit - Sélection exclusive / Tendances du moment
        </h2>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPatch(`/api/admin/home-products/${item.id}`, item);
          navigate('/admin/home');
        }}
        className="space-y-3"
      >
        <select
          value={item.productId}
          onChange={(event) => setItem({ ...item, productId: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          required
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <select
          value={item.type}
          onChange={(event) => setItem({ ...item, type: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
        >
          <option value="featured">Sélection exclusive</option>
          <option value="trending">Tendances du moment</option>
        </select>
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
