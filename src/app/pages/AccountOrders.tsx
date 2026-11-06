import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerOrders } from '../api/auth';
import { useAuth } from '../store/auth';
import { formatPrice } from '../utils/format';
import { formatOrderStatus, orderStatusClass } from '../utils/orderStatus';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  optionLabel?: string | null;
  optionValue?: string | null;
  product?: { image?: string | null };
};

type Order = {
  id: string;
  status: string;
  total: number;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
};

export const AccountOrders = () => {
  const navigate = useNavigate();
  const { customer, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !customer) {
      navigate('/account/login?returnTo=/account/orders');
    }
  }, [customer, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await customerOrders();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger vos commandes.');
      } finally {
        setIsLoading(false);
      }
    };
    if (customer) {
      load();
    }
  }, [customer]);

  if (!customer && !loading) {
    return null;
  }

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl text-[#2C2520]">Mes commandes</h1>
            <p className="text-[#6B5D52]">Bonjour {customer?.firstName}</p>
          </div>
          <Link to="/products" className="text-[#B8936A]">
            Continuer les achats
          </Link>
        </div>

        {customer?.address && (
          <div className="bg-white rounded-2xl p-4 mb-6 text-sm text-[#6B5D52]">
            Adresse sauvegardée: <span className="text-[#2C2520]">{customer.address}</span>
          </div>
        )}

        {isLoading && <p className="text-[#6B5D52]">Chargement...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!isLoading && orders.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-[#6B5D52]">Aucune commande pour le moment.</p>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <p className="text-[#2C2520] font-semibold">Commande {order.id}</p>
                  <p className="text-xs text-[#6B5D52]">
                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${orderStatusClass(order.status)}`}
                >
                  {formatOrderStatus(order.status)}
                </div>
              </div>

              <p className="text-sm text-[#6B5D52] mb-3">
                Adresse: {order.shippingAddress}
              </p>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.product?.image && (
                      <img
                        src={item.product.image}
                        alt={item.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-[#2C2520]">{item.name}</p>
                      {item.optionValue && (
                        <p className="text-xs text-[#6B5D52]">
                          {(item.optionLabel ?? 'Option')}: {item.optionValue}
                        </p>
                      )}
                      <p className="text-xs text-[#6B5D52]">
                        {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="text-[#B8936A]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#EEE2D2] mt-4 pt-4 text-right">
                <span className="text-[#2C2520] font-semibold">
                  Total: {formatPrice(order.total)}
                </span>
              </div>
              <div className="mt-4 text-right">
                <Link
                  to={`/account/orders/${order.id}`}
                  className="text-[#B8936A]"
                >
                  Voir le détail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
