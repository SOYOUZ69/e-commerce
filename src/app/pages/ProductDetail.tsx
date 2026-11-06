import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trackViewContent } from '../lib/metaPixel';
import { buildProductUrl, META_BRAND, META_CURRENCY, toAbsoluteUrl } from '../lib/site';
import { useCatalog } from '../store/catalog';
import { useCart } from '../store/cart';
import { formatPrice } from '../utils/format';

const SEO_TAG_IDS = [
  'seo-canonical',
  'seo-description',
  'seo-og-title',
  'seo-og-description',
  'seo-og-type',
  'seo-og-url',
  'seo-og-image',
  'seo-product-price-amount',
  'seo-product-price-currency',
  'seo-product-availability',
  'seo-product-jsonld',
];

const stripHtml = (value: string) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const upsertMetaTag = (
  id: string,
  key: 'name' | 'property',
  keyValue: string,
  content: string
) => {
  let tag = document.getElementById(id) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.id = id;
    tag.setAttribute(key, keyValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const ProductDetail = () => {
  const { slug } = useParams();
  const { products, getProductBySlug, fetchProductBySlug, loading } = useCatalog();
  const product = useMemo(() => (slug ? getProductBySlug(slug) : undefined), [slug, getProductBySlug]);
  const { addItem } = useCart();
  const viewContentTrackedRef = useRef<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [optionError, setOptionError] = useState<string>('');
  const galleryImages = useMemo(() => {
    if (!product) {
      return [];
    }
    const urls: string[] = [];
    if (product.image) {
      urls.push(product.image);
    }
    (product.images ?? []).forEach((item) => {
      if (item.url && !urls.includes(item.url)) {
        urls.push(item.url);
      }
    });
    return urls;
  }, [product]);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (slug && !product) {
      fetchProductBySlug(slug);
    }
  }, [slug, product, fetchProductBySlug]);

  useEffect(() => {
    if (galleryImages.length) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages]);

  useEffect(() => {
    if (product?.optionValues && product.optionValues.length > 0) {
      setSelectedOption('');
      setOptionError('');
    }
  }, [product]);

  useEffect(() => {
    if (!product || !slug) {
      return;
    }

    const productUrl = buildProductUrl(slug);
    const description = stripHtml(product.shortDescription || product.description);
    const mainImage = toAbsoluteUrl(galleryImages[0] || product.image);
    const availability =
      Number(product.stock || 0) > 0 && String(product.status || '').toLowerCase() === 'active'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock';

    document.title = `${product.name} | ${META_BRAND}`;

    let canonical = document.getElementById('seo-canonical') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.id = 'seo-canonical';
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = productUrl;

    upsertMetaTag('seo-description', 'name', 'description', description);
    upsertMetaTag('seo-og-title', 'property', 'og:title', product.name);
    upsertMetaTag('seo-og-description', 'property', 'og:description', description);
    upsertMetaTag('seo-og-type', 'property', 'og:type', 'product');
    upsertMetaTag('seo-og-url', 'property', 'og:url', productUrl);
    upsertMetaTag('seo-og-image', 'property', 'og:image', mainImage);
    upsertMetaTag('seo-product-price-amount', 'property', 'product:price:amount', String(product.price));
    upsertMetaTag('seo-product-price-currency', 'property', 'product:price:currency', META_CURRENCY);
    upsertMetaTag('seo-product-availability', 'property', 'product:availability', availability);

    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image: mainImage ? [mainImage] : [],
      sku: product.sku || product.id,
      url: productUrl,
      offers: {
        '@type': 'Offer',
        price: String(product.price),
        priceCurrency: META_CURRENCY,
        availability,
        itemCondition: 'https://schema.org/NewCondition',
        url: productUrl,
      },
    };

    let jsonLd = document.getElementById('seo-product-jsonld') as HTMLScriptElement | null;
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.id = 'seo-product-jsonld';
      jsonLd.type = 'application/ld+json';
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify(productSchema);

    return () => {
      SEO_TAG_IDS.forEach((id) => {
        const element = document.getElementById(id);
        if (element?.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      document.title = META_BRAND;
    };
  }, [galleryImages, product, slug]);

  useEffect(() => {
    if (!product) {
      return;
    }
    if (viewContentTrackedRef.current === product.id) {
      return;
    }
    trackViewContent(product);
    viewContentTrackedRef.current = product.id;
  }, [product]);

  if (!product) {
    return (
      <section className="py-16 bg-[#FAF8F3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl text-[#2C2520] mb-4">
            {loading ? 'Chargement...' : 'Produit introuvable'}
          </h1>
          <p className="text-[#6B5D52] mb-6">
            Ce produit n'existe pas ou a été retiré de la collection.
          </p>
          <Link
            to="/products"
            className="inline-block bg-[#B8936A] text-white px-6 py-3 hover:bg-[#2C2520] transition-colors"
          >
            Retour à la boutique
          </Link>
        </div>
      </section>
    );
  }

  const related = products.filter(
    (item) => item.category === product.category && item.id !== product.id
  );
  const optionValues = product.optionValues ?? [];
  const hasOptions = optionValues.length > 0;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="bg-[#FAF8F3] rounded-2xl p-6">
            <div className="aspect-square overflow-hidden rounded-xl">
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {galleryImages.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(url)}
                    className={`flex-none w-20 h-20 border rounded-lg overflow-hidden ${
                      activeImage === url ? 'border-[#B8936A]' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt={product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-[#B8936A] mb-3">
              {product.category}
            </p>
            <h1 className="text-4xl text-[#2C2520] mb-4">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-[#2C2520]/80 mb-4 whitespace-pre-line">
                {product.shortDescription}
              </p>
            )}
            <p className="text-[#6B5D52] mb-6">{product.description}</p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl text-[#B8936A]">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <label htmlFor="quantity" className="text-[#2C2520]">
                Quantité
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="w-20 border border-[#B8936A] px-3 py-2"
              />
            </div>

            {hasOptions && (
              <div className="mb-6">
                <p className="text-[#2C2520] mb-2">
                  {product.optionLabel ?? 'Option'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {optionValues.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSelectedOption(value);
                        setOptionError('');
                      }}
                      className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                        selectedOption === value
                          ? 'bg-[#B8936A] text-white border-[#B8936A]'
                          : 'border-[#B8936A] text-[#2C2520] hover:bg-[#B8936A] hover:text-white'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                {optionError && (
                  <p className="text-sm text-red-600 mt-2">{optionError}</p>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (hasOptions && !selectedOption) {
                  setOptionError('Veuillez sélectionner une option.');
                  return;
                }
                addItem(product, quantity, {
                  optionLabel: product.optionLabel ?? null,
                  optionValue: hasOptions ? selectedOption : null,
                });
              }}
              className="bg-[#2C2520] text-white px-8 py-3 hover:bg-[#B8936A] transition-colors"
            >
              Ajouter au panier
            </button>

            <div className="mt-10">
              <h2 className="text-xl text-[#2C2520] mb-4">Détails</h2>
              {product.details.length === 0 ? (
                <p className="text-[#6B5D52]">Aucun détail disponible.</p>
              ) : (
                <ul className="space-y-2 text-[#6B5D52]">
                  {product.details.map((detail) => (
                    <li key={detail}>• {detail}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl text-[#2C2520]">Produits associés</h2>
              <Link
                to="/products"
                className="text-[#B8936A] hover:text-[#2C2520] transition-colors"
              >
                Voir tout
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-white">
                  <Link to={`/product/${item.slug}`}>
                    <img src={item.image} alt={item.name} className="rounded-lg mb-4" />
                  </Link>
                  <Link to={`/product/${item.slug}`} className="text-[#2C2520] mb-2 block">
                    {item.name}
                  </Link>
                  <p className="text-[#B8936A]">{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
