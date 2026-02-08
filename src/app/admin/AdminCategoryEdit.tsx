import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminGet, adminPatch, adminUpload } from '../api/admin';
import type { Category } from './types';

export const AdminCategoryEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      try {
        const categories = await adminGet('/api/admin/categories');
        const found = categories.find((item: Category) => item.id === id) ?? null;
        setCategory(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <p className="text-[#6B5D52]">Chargement...</p>;
  }

  if (!category) {
    return (
      <div>
        <p className="text-red-600">Categorie introuvable.</p>
        <Link to="/admin/catalog" className="text-[#B8936A]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">Modifier categorie</h2>
        <button
          onClick={() => navigate('/admin/catalog')}
          className="text-[#B8936A]"
        >
          Retour
        </button>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPatch(`/api/admin/categories/${category.id}`, category);
          navigate('/admin/catalog');
        }}
        className="space-y-3"
      >
        <input
          value={category.name}
          onChange={(event) => setCategory({ ...category, name: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Nom"
          required
        />
        <input
          value={category.slug}
          onChange={(event) => setCategory({ ...category, slug: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Slug"
          required
        />
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              try {
                setUploading(true);
                const data = await adminUpload(file);
                setCategory({ ...category, image: data.url });
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
              } finally {
                setUploading(false);
              }
            }}
            className="w-full border border-[#B8936A] px-3 py-2"
          />
          {category.image && (
            <img src={category.image} alt="Categorie" className="h-20 rounded" />
          )}
          {uploading && <p className="text-sm text-[#6B5D52]">Upload en cours...</p>}
        </div>
        <textarea
          value={category.description ?? ''}
          onChange={(event) => setCategory({ ...category, description: event.target.value })}
          className="w-full border border-[#B8936A] px-3 py-2"
          placeholder="Description"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={category.isActive}
            onChange={(event) => setCategory({ ...category, isActive: event.target.checked })}
          />
          Active
        </label>
        <button className="bg-[#2C2520] text-white px-4 py-2">Enregistrer</button>
      </form>
    </div>
  );
};
