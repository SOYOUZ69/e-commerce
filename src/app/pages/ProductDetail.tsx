import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../store/catalog';
import { useCart } from '../store/cart';
import { formatPrice } from '../utils/format';

export const ProductDetail = () => {
  const { slug } = useParams();
  const { products, getProductBySlug, fetchProductBySlug, loading } = useCatalog();
  const product = useMemo(() => (slug ? getProductBySlug(slug) : undefined), [slug, getProductBySlug]);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (slug && !product) {
      fetchProductBySlug(slug);
    }
  }, [slug, product, fetchProductBySlug]);

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

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-[#FAF8F3] rounded-2xl p-6">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
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

            <button
              onClick={() => addItem(product, quantity)}
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
                  <Link to={`/products/${item.slug}`}>
                    <img src={item.image} alt={item.name} className="rounded-lg mb-4" />
                  </Link>
                  <Link to={`/products/${item.slug}`} className="text-[#2C2520] mb-2 block">
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
