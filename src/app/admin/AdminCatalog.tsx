import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { adminDelete, adminGet, adminPost, adminUpload } from '../api/admin';
import { SectionCard } from './SectionCard';
import type { Category, Product } from './types';
import { formatPrice } from '../utils/format';

export const AdminCatalog = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryUploading, setCategoryUploading] = useState(false);
  const [productUploading, setProductUploading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');

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
    images: [] as string[],
    description: '',
    categoryId: '',
    optionEnabled: false,
    optionLabel: '',
    optionValues: [] as string[],
  });
  const productImages = productForm.images ?? [];
  const optionValues = productForm.optionValues ?? [];

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
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      if (productCategoryFilter && product.categoryId !== productCategoryFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const name = product.name?.toLowerCase() ?? '';
      const slug = product.slug?.toLowerCase() ?? '';
      const sku = product.sku?.toLowerCase() ?? '';
      return name.includes(term) || slug.includes(term) || sku.includes(term);
    });
  }, [products, productSearch, productCategoryFilter]);

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
                image: productForm.image || productImages[0],
                optionLabel: productForm.optionEnabled ? productForm.optionLabel : null,
                optionValues: productForm.optionEnabled ? optionValues : [],
                price: Number(productForm.price),
              });
              setProductForm({
                name: '',
                slug: '',
                price: '',
                image: '',
                images: [],
                description: '',
                categoryId: '',
                optionEnabled: false,
                optionLabel: '',
                optionValues: [],
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
                multiple
                onChange={async (event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (!files.length) {
                    return;
                  }
                  try {
                    setProductUploading(true);
                    for (const file of files) {
                      const data = await adminUpload(file);
                      setProductForm((prev) => {
                        const nextImages = [...(prev.images ?? []), data.url];
                        return {
                          ...prev,
                          images: nextImages,
                          image: prev.image || data.url,
                        };
                      });
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Upload failed');
                  } finally {
                    setProductUploading(false);
                  }
                }}
                className="w-full border border-[#B8936A] px-3 py-2"
              />
              {productImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {productImages.map((url, index) => (
                    <div key={url} className="relative group">
                      <img src={url} alt="Produit" className="h-20 w-full object-contain rounded bg-[#FAF8F3]" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 text-xs text-white px-2 py-1">
                        <span>{index === 0 ? 'Principale' : 'Secondaire'}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((prev) => {
                              const next = (prev.images ?? []).filter((item) => item !== url);
                              return {
                                ...prev,
                                images: next,
                                image: next[0] ?? '',
                              };
                            })
                          }
                        >
                          Retirer
                        </button>
                      </div>
                      {index !== 0 && (
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-white/90 text-xs px-2 py-1 rounded"
                          onClick={() =>
                            setProductForm((prev) => {
                              const next = (prev.images ?? []).filter((item) => item !== url);
                              return {
                                ...prev,
                                images: [url, ...next],
                                image: url,
                              };
                            })
                          }
                        >
                          Principale
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={productForm.optionEnabled}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      optionEnabled: event.target.checked,
                      optionLabel: event.target.checked ? prev.optionLabel : '',
                      optionValues: event.target.checked ? prev.optionValues : [],
                    }))
                  }
                />
                Activer les options (couleur, taille, pièces...)
              </label>
              {productForm.optionEnabled && (
                <div className="space-y-2">
                  <input
                    placeholder="Nom de l'option (ex: Couleur)"
                    value={productForm.optionLabel}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, optionLabel: event.target.value }))
                    }
                    className="w-full border border-[#B8936A] px-3 py-2"
                    required
                  />
                  {optionValues.map((value, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={value}
                        onChange={(event) =>
                          setProductForm((prev) => {
                            const next = [...(prev.optionValues ?? [])];
                            next[index] = event.target.value;
                            return { ...prev, optionValues: next };
                          })
                        }
                        className="flex-1 border border-[#B8936A] px-3 py-2"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((prev) => ({
                            ...prev,
                            optionValues: (prev.optionValues ?? []).filter((_, i) => i !== index),
                          }))
                        }
                        className="text-sm text-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((prev) => ({
                        ...prev,
                        optionValues: [...(prev.optionValues ?? []), ''],
                      }))
                    }
                    className="text-sm text-[#B8936A]"
                  >
                    + Ajouter une option
                  </button>
                </div>
              )}
            </div>
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

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Rechercher un produit (nom, slug, SKU)"
                className="flex-1 border border-[#B8936A] px-3 py-2"
              />
              <select
                value={productCategoryFilter}
                onChange={(event) => setProductCategoryFilter(event.target.value)}
                className="border border-[#B8936A] px-3 py-2"
              >
                <option value="">Toutes les catégories</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

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
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t border-[#EEE2D2]">
                      <td className="py-2 text-[#2C2520]">{product.name}</td>
                      <td className="py-2 text-[#6B5D52]">{product.slug}</td>
                      <td className="py-2 text-[#6B5D52]">{formatPrice(product.price)}</td>
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
                  {filteredProducts.length === 0 && (
                    <tr className="border-t border-[#EEE2D2]">
                      <td colSpan={4} className="py-4 text-center text-[#6B5D52]">
                        Aucun produit ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
