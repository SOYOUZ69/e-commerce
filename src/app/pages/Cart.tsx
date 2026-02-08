import { Link } from 'react-router-dom';
import { useCart } from '../store/cart';
import { formatPrice } from '../utils/format';

export const Cart = () => {
  const { items, cartCount, subtotal, updateQuantity, removeItem, clear, loading, error } = useCart();

  if (!loading && cartCount === 0) {
    return (
      <section className="py-16 bg-[#FAF8F3]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl text-[#2C2520] mb-4">Votre panier est vide</h1>
          <p className="text-[#6B5D52] mb-6">
            Découvrez nos produits et ajoutez vos coups de cœur.
          </p>
          <Link
            to="/products"
            className="inline-block bg-[#B8936A] text-white px-6 py-3 hover:bg-[#2C2520] transition-colors"
          >
            Continuer vos achats
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl text-[#2C2520]">Votre panier</h1>
            <p className="text-[#6B5D52]">{cartCount} article(s)</p>
          </div>
          <button
            onClick={clear}
            className="border border-[#B8936A] text-[#B8936A] px-4 py-2 hover:bg-[#B8936A] hover:text-white transition-colors"
          >
            Vider le panier
          </button>
        </div>

        {loading && <p className="text-[#6B5D52]">Loading cart...</p>}
        {error && <p className="text-[#B8936A]">{error}</p>}

        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.product.id} className="flex flex-col md:flex-row gap-6 border-b pb-6">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-full md:w-40 h-40 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl text-[#2C2520]">{item.product.name}</h2>
                    <p className="text-[#6B5D52]">{item.product.category}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-sm text-[#B8936A] hover:text-[#2C2520]"
                  >
                    Supprimer
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor={`qty-${item.product.id}`} className="text-[#2C2520]">
                      Quantité
                    </label>
                    <input
                      id={`qty-${item.product.id}`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(item.product.id, Math.max(1, Number(event.target.value) || 1))
                      }
                      className="w-20 border border-[#B8936A] px-3 py-2"
                    />
                  </div>
                  <span className="text-[#B8936A] font-semibold">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-[#FAF8F3] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[#6B5D52]">Sous-total</p>
            <p className="text-2xl text-[#2C2520]">{formatPrice(subtotal)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="border border-[#2C2520] text-[#2C2520] px-6 py-3 hover:bg-[#2C2520] hover:text-white transition-colors"
            >
              Continuer les achats
            </Link>
            <Link
              to="/checkout"
              className="bg-[#B8936A] text-white px-6 py-3 hover:bg-[#2C2520] transition-colors"
            >
              Passer au paiement
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
