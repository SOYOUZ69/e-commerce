import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminGet, adminPatch } from '../api/admin';
import type { Category, HomeCategory } from './types';

export const AdminHomeCategoryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<HomeCategory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homeCategories, setHomeCategories] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      try {
        const [items, categoriesData] = await Promise.all([
          adminGet('/api/admin/home-categories'),
          adminGet('/api/admin/categories'),
        ]);
        const found = items.find((entry: HomeCategory) => entry.id === id) ?? null;
        setItem(found);
        setCategories(categoriesData);
        setHomeCategories(items);
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

  const usedCategoryIds = new Set(
    homeCategories.filter((entry) => entry.id !== item.id).map((entry) => entry.categoryId)
  );
  const availableCategories = categories.filter(
    (category) => category.id === item.categoryId || !usedCategoryIds.has(category.id)
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">Modifier categorie mise en avant</h2>
        <Link to="/admin/home" className="text-[#B8936A]">Retour</Link>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await adminPatch(`/api/admin/home-categories/${item.id}`, {
              categoryId: item.categoryId,
              position: item.position,
              isActive: item.isActive,
            });
            navigate('/admin/home');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update item');
          }
        }}
        className="space-y-3"
      >
        <select
          value={item.categoryId}
          onChange={(event) => setItem({ ...item, categoryId: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          required
        >
          {availableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
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
