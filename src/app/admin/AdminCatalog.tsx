import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { adminDelete, adminGet, adminPost, adminUpload } from '../api/admin';
import { SectionCard } from './SectionCard';
import type { Category, Product } from './types';

export const AdminCatalog = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryUploading, setCategoryUploading] = useState(false);
  const [productUploading, setProductUploading] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
  });
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    price: '',
    image: '',
    description: '',
    categoryId: '',
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, productsData] = await Promise.all([
        adminGet('/api/admin/categories'),
        adminGet('/api/admin/products'),
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const categoryOptions = useMemo(() => categories, [categories]);

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-[#6B5D52]">Chargement des donnees...</p>}

      <SectionCard title="Categories">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await adminPost('/api/admin/categories', categoryForm);
              setCategoryForm({ name: '', slug: '', description: '', image: '', isActive: true });
              refresh();
            }}
            className="space-y-3"
          >
            <input
              placeholder="Nom"
              value={categoryForm.name}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="Slug"
              value={categoryForm.slug}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
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
                    setCategoryUploading(true);
                    const data = await adminUpload(file);
                    setCategoryForm((prev) => ({ ...prev, image: data.url }));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Upload failed');
                  } finally {
                    setCategoryUploading(false);
                  }
                }}
                className="w-full border border-[#B8936A] px-3 py-2"
              />
              {categoryForm.image && (
                <img src={categoryForm.image} alt="Categorie" className="h-20 rounded" />
              )}
              {categoryUploading && (
                <p className="text-sm text-[#6B5D52]">Upload en cours...</p>
              )}
            </div>
            <textarea
              placeholder="Description"
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Active
            </label>
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Nom</th>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Active</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{category.name}</td>
                    <td className="py-2 text-[#6B5D52]">{category.slug}</td>
                    <td className="py-2 text-[#6B5D52]">{category.isActive ? 'Oui' : 'Non'}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/catalog/categories/${category.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                        aria-label={`Modifier ${category.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                <button
                  onClick={async () => {
                    try {
                      await adminDelete(`/api/admin/categories/${category.id}`);
                      refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Delete failed');
                    }
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

      <SectionCard title="Produits">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await adminPost('/api/admin/products', {
                ...productForm,
                price: Number(productForm.price),
              });
              setProductForm({
                name: '',
                slug: '',
                price: '',
                image: '',
                description: '',
                categoryId: '',
              });
              refresh();
            }}
            className="space-y-3"
          >
            <input
              placeholder="Nom"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="Slug"
              value={productForm.slug}
              onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="Prix"
              type="number"
              value={productForm.price}
              onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
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
                    setProductUploading(true);
                    const data = await adminUpload(file);
                    setProductForm((prev) => ({ ...prev, image: data.url }));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Upload failed');
                  } finally {
                    setProductUploading(false);
                  }
                }}
                className="w-full border border-[#B8936A] px-3 py-2"
              />
              {productForm.image && (
                <img src={productForm.image} alt="Produit" className="h-20 rounded" />
              )}
              {productUploading && (
                <p className="text-sm text-[#6B5D52]">Upload en cours...</p>
              )}
            </div>
            <textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <select
              value={productForm.categoryId}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            >
              <option value="">Categorie</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto max-h-[360px]">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Nom</th>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Prix</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{product.name}</td>
                    <td className="py-2 text-[#6B5D52]">{product.slug}</td>
                    <td className="py-2 text-[#6B5D52]">${product.price}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/catalog/products/${product.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                        aria-label={`Modifier ${product.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await adminDelete(`/api/admin/products/${product.id}`);
                            refresh();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Delete failed');
                          }
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
