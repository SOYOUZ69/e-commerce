import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { adminDelete, adminGet, adminPost, adminUpload } from '../api/admin';
import { SectionCard } from './SectionCard';
import type {
  Category,
  FeatureItem,
  HeroSection,
  HomeCategory,
  HomeProduct,
  Product,
  PromoBanner,
} from './types';

export const AdminHome = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [hero, setHero] = useState<HeroSection>({});
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [promos, setPromos] = useState<PromoBanner[]>([]);
  const [homeCategories, setHomeCategories] = useState<HomeCategory[]>([]);
  const [homeProducts, setHomeProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoUploading, setPromoUploading] = useState(false);

  const [featureForm, setFeatureForm] = useState({ title: '', description: '', iconKey: '', position: 0 });
  const [promoForm, setPromoForm] = useState({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaUrl: '',
    imageUrl: '',
    themeColor: '',
    position: 0,
  });
  const [homeCategoryForm, setHomeCategoryForm] = useState({
    categoryId: '',
    position: 0,
  });
  const [homeProductForm, setHomeProductForm] = useState({
    productId: '',
    type: 'featured',
    position: 0,
  });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        categoriesData,
        productsData,
        heroData,
        featuresData,
        promosData,
        homeCategoriesData,
        homeProductsData,
      ] = await Promise.all([
        adminGet('/api/admin/categories'),
        adminGet('/api/admin/products'),
        adminGet('/api/admin/hero'),
        adminGet('/api/admin/features'),
        adminGet('/api/admin/promo-banners'),
        adminGet('/api/admin/home-categories'),
        adminGet('/api/admin/home-products'),
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
      setHero(heroData ?? {});
      setFeatures(featuresData);
      setPromos(promosData);
      setHomeCategories(homeCategoriesData);
      setHomeProducts(homeProductsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const usedCategoryIds = useMemo(
    () => new Set(homeCategories.map((item) => item.categoryId)),
    [homeCategories]
  );
  const categoryOptions = useMemo(
    () => categories.filter((category) => !usedCategoryIds.has(category.id)),
    [categories, usedCategoryIds]
  );
  const productOptions = useMemo(() => products, [products]);

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-[#6B5D52]">Chargement des donnees...</p>}

      <SectionCard title="Hero">
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[#6B5D52]">
              <tr>
                <th className="py-2">Titre</th>
                <th className="py-2">Actif</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#EEE2D2]">
                <td className="py-2 text-[#2C2520]">{hero.title ?? 'Hero'}</td>
                <td className="py-2 text-[#6B5D52]">{hero.isActive ? 'Oui' : 'Non'}</td>
                <td className="py-2 text-right">
                  <Link
                    to="/admin/home/hero"
                    className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                  >
                    <Pencil className="w-4 h-4" />
                    Modifier
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Features">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await adminPost('/api/admin/features', { ...featureForm, position: Number(featureForm.position) });
              setFeatureForm({ title: '', description: '', iconKey: '', position: 0 });
              refresh();
            }}
            className="space-y-3"
          >
            <input
              placeholder="Titre"
              value={featureForm.title}
              onChange={(event) => setFeatureForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="Icon key"
              value={featureForm.iconKey}
              onChange={(event) => setFeatureForm((prev) => ({ ...prev, iconKey: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <textarea
              placeholder="Description"
              value={featureForm.description}
              onChange={(event) => setFeatureForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Position"
              value={featureForm.position}
              onChange={(event) => setFeatureForm((prev) => ({ ...prev, position: Number(event.target.value) }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Titre</th>
                  <th className="py-2">Position</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {features.map((item) => (
                  <tr key={item.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{item.title}</td>
                    <td className="py-2 text-[#6B5D52]">{item.position}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/home/features/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        onClick={async () => {
                          await adminDelete(`/api/admin/features/${item.id}`);
                          refresh();
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

      <SectionCard title="Promo Banners">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await adminPost('/api/admin/promo-banners', {
                ...promoForm,
                position: Number(promoForm.position),
              });
              setPromoForm({
                title: '',
                subtitle: '',
                ctaLabel: '',
                ctaUrl: '',
                imageUrl: '',
                themeColor: '',
                position: 0,
              });
              refresh();
            }}
            className="space-y-3"
          >
            <input
              placeholder="Titre"
              value={promoForm.title}
              onChange={(event) => setPromoForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            />
            <input
              placeholder="Sous-titre"
              value={promoForm.subtitle}
              onChange={(event) => setPromoForm((prev) => ({ ...prev, subtitle: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <input
              placeholder="CTA Label"
              value={promoForm.ctaLabel}
              onChange={(event) => setPromoForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <input
              placeholder="CTA URL"
              value={promoForm.ctaUrl}
              onChange={(event) => setPromoForm((prev) => ({ ...prev, ctaUrl: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
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
                    setPromoUploading(true);
                    const data = await adminUpload(file);
                    setPromoForm((prev) => ({ ...prev, imageUrl: data.url }));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Upload failed');
                  } finally {
                    setPromoUploading(false);
                  }
                }}
                className="w-full border border-[#B8936A] px-3 py-2"
              />
              {promoForm.imageUrl && (
                <img src={promoForm.imageUrl} alt="Promo" className="h-20 rounded" />
              )}
              {promoUploading && (
                <p className="text-sm text-[#6B5D52]">Upload en cours...</p>
              )}
            </div>
            <input
              placeholder="Theme color"
              value={promoForm.themeColor}
              onChange={(event) => setPromoForm((prev) => ({ ...prev, themeColor: event.target.value }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <input
              type="number"
              placeholder="Position"
              value={promoForm.position}
              onChange={(event) => setPromoForm((prev) => ({ ...prev, position: Number(event.target.value) }))}
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Titre</th>
                  <th className="py-2">Position</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((item) => (
                  <tr key={item.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{item.title}</td>
                    <td className="py-2 text-[#6B5D52]">{item.position}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/home/promos/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        onClick={async () => {
                          await adminDelete(`/api/admin/promo-banners/${item.id}`);
                          refresh();
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

      <SectionCard title="Categories mises en avant">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await adminPost('/api/admin/home-categories', {
                  ...homeCategoryForm,
                  position: Number(homeCategoryForm.position),
                });
                setHomeCategoryForm({ categoryId: '', position: 0 });
                refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to add category highlight');
              }
            }}
            className="space-y-3"
          >
            <select
              value={homeCategoryForm.categoryId}
              onChange={(event) =>
                setHomeCategoryForm((prev) => ({ ...prev, categoryId: event.target.value }))
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
            <input
              type="number"
              placeholder="Position"
              value={homeCategoryForm.position}
              onChange={(event) =>
                setHomeCategoryForm((prev) => ({ ...prev, position: Number(event.target.value) }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Categorie</th>
                  <th className="py-2">Position</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {homeCategories.map((item) => (
                  <tr key={item.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{item.category?.name ?? item.categoryId}</td>
                    <td className="py-2 text-[#6B5D52]">{item.position}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/home/home-categories/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        onClick={async () => {
                          await adminDelete(`/api/admin/home-categories/${item.id}`);
                          refresh();
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

      <SectionCard title="Produits mis en avant">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await adminPost('/api/admin/home-products', {
                ...homeProductForm,
                position: Number(homeProductForm.position),
              });
              setHomeProductForm({ productId: '', type: 'featured', position: 0 });
              refresh();
            }}
            className="space-y-3"
          >
            <select
              value={homeProductForm.productId}
              onChange={(event) =>
                setHomeProductForm((prev) => ({ ...prev, productId: event.target.value }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
              required
            >
              <option value="">Produit</option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select
              value={homeProductForm.type}
              onChange={(event) =>
                setHomeProductForm((prev) => ({ ...prev, type: event.target.value }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
            >
              <option value="featured">Featured</option>
              <option value="trending">Trending</option>
            </select>
            <input
              type="number"
              placeholder="Position"
              value={homeProductForm.position}
              onChange={(event) =>
                setHomeProductForm((prev) => ({ ...prev, position: Number(event.target.value) }))
              }
              className="w-full border border-[#B8936A] px-3 py-2"
            />
            <button className="bg-[#2C2520] text-white px-4 py-2">Ajouter</button>
          </form>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#6B5D52]">
                <tr>
                  <th className="py-2">Produit</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {homeProducts.map((item) => (
                  <tr key={item.id} className="border-t border-[#EEE2D2]">
                    <td className="py-2 text-[#2C2520]">{item.product?.name ?? item.productId}</td>
                    <td className="py-2 text-[#6B5D52]">{item.type}</td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/admin/home/home-products/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#B8936A] hover:text-[#2C2520]"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        onClick={async () => {
                          await adminDelete(`/api/admin/home-products/${item.id}`);
                          refresh();
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
