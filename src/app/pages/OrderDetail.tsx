import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { customerOrderById } from '../api/auth';
import { useAuth } from '../store/auth';
import { formatPrice } from '../utils/format';
import { formatOrderStatus, orderStatusClass } from '../utils/orderStatus';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
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

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customer, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !customer) {
      navigate(`/account/login?returnTo=/account/orders/${id ?? ''}`);
    }
  }, [customer, loading, navigate, id]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await customerOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };
    if (customer) {
      load();
    }
  }, [customer, id]);

  if (!customer && !loading) {
    return null;
  }

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl text-[#2C2520]">Détail de commande</h1>
            {order && (
              <p className="text-[#6B5D52]">Commande {order.id}</p>
            )}
          </div>
          <Link to="/account/orders" className="text-[#B8936A]">
            Retour
          </Link>
        </div>

        {isLoading && <p className="text-[#6B5D52]">Chargement...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {order && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${orderStatusClass(order.status)}`}
              >
                {formatOrderStatus(order.status)}
              </span>
              <span className="text-xs text-[#6B5D52]">
                {new Date(order.createdAt).toLocaleString('fr-FR')}
              </span>
            </div>

            <div>
              <h2 className="text-lg text-[#2C2520] mb-2">Adresse de livraison</h2>
              <p className="text-[#6B5D52]">{order.shippingAddress}</p>
            </div>

            <div>
              <h2 className="text-lg text-[#2C2520] mb-3">Produits</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.product?.image && (
                      <img
                        src={item.product.image}
                        alt={item.name}
                        className="h-14 w-14 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-[#2C2520]">{item.name}</p>
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
            </div>

            <div className="border-t border-[#EEE2D2] pt-4 text-right">
              <span className="text-[#2C2520] font-semibold">
                Total: {formatPrice(order.total)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
