import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminGet, adminPatch, adminUpload } from '../api/admin';
import type { Category, Product } from './types';

const toNumber = (value: string) => (value === '' ? undefined : Number(value));

export const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }
      try {
        const [products, categoriesData] = await Promise.all([
          adminGet('/api/admin/products'),
          adminGet('/api/admin/categories'),
        ]);
        const found = products.find((item: Product) => item.id === id) ?? null;
        setProduct(found);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <p className="text-[#6B5D52]">Chargement...</p>;
  }

  if (!product) {
    return (
      <div>
        <p className="text-red-600">Produit introuvable.</p>
        <Link to="/admin/catalog" className="text-[#B8936A]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl text-[#2C2520]">Modifier produit</h2>
        <button onClick={() => navigate('/admin/catalog')} className="text-[#B8936A]">
          Retour
        </button>
      </div>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await adminPatch(`/api/admin/products/${product.id}`, {
            slug: product.slug,
            name: product.name,
            sku: product.sku ?? null,
            price: Number(product.price),
            originalPrice: product.originalPrice ?? null,
            stock: product.stock ?? 0,
            status: product.status ?? 'active',
            image: product.image,
            badge: product.badge ?? null,
            rating: product.rating ?? null,
            shortDescription: product.shortDescription ?? null,
            description: product.description,
            details: product.details ?? [],
            categoryId: product.categoryId,
          });
          navigate('/admin/catalog');
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          value={product.name}
          onChange={(event) => setProduct({ ...product, name: event.target.value })}
          className="border border-[#B8936A] px-3 py-2"
          placeholder="Nom"
          required
        />
        <input
          value={product.slug}
          onChange={(event) => setProduct({ ...product, slug: event.target.value })}
          className="border border-[#B8936A] px-3 py-2"
          placeholder="Slug"
          required
        />
        <input
          value={product.sku ?? ''}
          onChange={(event) => setProduct({ ...product, sku: event.target.value })}
          className="border border-[#B8936A] px-3 py-2"
          placeholder="SKU"
        />
        <select
          value={product.status ?? 'active'}
          onChange={(event) => setProduct({ ...product, status: event.target.value })}
          className="border border-[#B8936A] px-3 py-2"
        >
          <option value="active">Actif</option>
          <option value="draft">Brouillon</option>
          <option value="archived">Archive</option>
        </select>
        <input
          type="number"
          value={product.price}
          onChange={(event) => setProduct({ ...product, price: Number(event.target.value) })}
          className="border border-[#B8936A] px-3 py-2"
          placeholder="Prix"
          required
        />
        <input
          type="number"
          value={product.originalPrice ?? ''}
          onChange={(event) =>
            setProduct({ ...product, originalPrice: toNumber(event.target.value) ?? null })
          }
          className="border border-[#B8936A] px-3 py-2"
          placeholder="Prix original"
        />
        <input
          type="number"
          value={product.stock ?? 0}
          onChange={(event) => setProduct({ ...product, stock: Number(event.target.value) })}
          className="border border-[#B8936A] px-3 py-2"
          placeholder="Stock"
        />
        <input
          type="number"
          value={product.rating ?? ''}
          onChange={(event) => setProduct({ ...product, rating: toNumber(event.target.value) ?? null })}
          className="border border-[#B8936A] px-3 py-2"
          placeholder="Note"
        />
        <div className="space-y-2 md:col-span-2">
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
                setProduct({ ...product, image: data.url });
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
              } finally {
                setUploading(false);
              }
            }}
            className="border border-[#B8936A] px-3 py-2 w-full"
          />
          {product.image && (
            <img src={product.image} alt="Produit" className="h-24 rounded" />
          )}
          {uploading && <p className="text-sm text-[#6B5D52]">Upload en cours...</p>}
        </div>
        <input
          value={product.badge ?? ''}
          onChange={(event) => setProduct({ ...product, badge: event.target.value })}
          className="border border-[#B8936A] px-3 py-2"
          placeholder="Badge"
        />
        <select
          value={product.categoryId}
          onChange={(event) => setProduct({ ...product, categoryId: event.target.value })}
          className="border border-[#B8936A] px-3 py-2"
          required
        >
          <option value="">Categorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <textarea
          value={product.shortDescription ?? ''}
          onChange={(event) => setProduct({ ...product, shortDescription: event.target.value })}
          className="border border-[#B8936A] px-3 py-2 md:col-span-2"
          placeholder="Description courte"
        />
        <textarea
          value={product.description}
          onChange={(event) => setProduct({ ...product, description: event.target.value })}
          className="border border-[#B8936A] px-3 py-2 md:col-span-2"
          placeholder="Description"
          required
        />
        <textarea
          value={(product.details ?? []).join('\n')}
          onChange={(event) =>
            setProduct({
              ...product,
              details: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
            })
          }
          className="border border-[#B8936A] px-3 py-2 md:col-span-2"
          placeholder="Details (une ligne par point)"
        />
        <button className="bg-[#2C2520] text-white px-4 py-2 md:col-span-2">Enregistrer</button>
      </form>
    </div>
  );
};
