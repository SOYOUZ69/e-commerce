import { useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPatch } from '../api/admin';
import { formatPrice } from '../utils/format';
import { formatOrderStatus, orderStatusClass } from '../utils/orderStatus';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  optionLabel?: string | null;
  optionValue?: string | null;
  product?: {
    image?: string | null;
  };
};

type Order = {
  id: string;
  status: string;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet('/api/admin/orders');
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[#2C2520]">Commandes</h2>
        <p className="text-[#6B5D52]">Suivi et gestion des statuts.</p>
      </div>

      {loading && <p className="text-[#6B5D52]">Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[#2C2520] font-semibold">Commande {order.id}</p>
                <p className="text-xs text-[#6B5D52]">
                  {new Date(order.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#6B5D52]">Statut</label>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${orderStatusClass(order.status)}`}
                >
                  {formatOrderStatus(order.status)}
                </span>
                <select
                  value={order.status}
                  onChange={async (event) => {
                    const status = event.target.value;
                    try {
                      const updated = await adminPatch(`/api/admin/orders/${order.id}`, { status });
                      setOrders((prev) =>
                        prev.map((item) => (item.id === order.id ? updated : item))
                      );
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Update failed');
                    }
                  }}
                  className="border border-[#B8936A] px-3 py-2"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatOrderStatus(status)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="border border-red-500 text-red-600 px-3 py-2 rounded-md text-sm hover:bg-red-50 disabled:opacity-60"
                  disabled={deletingId === order.id}
                  onClick={async () => {
                    const ok = window.confirm('Supprimer cette commande ? Cette action est définitive.');
                    if (!ok) return;
                    setDeletingId(order.id);
                    setError(null);
                    try {
                      await adminDelete(`/api/admin/orders/${order.id}`);
                      setOrders((prev) => prev.filter((item) => item.id !== order.id));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Delete failed');
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                >
                  {deletingId === order.id ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#6B5D52]">
              <div>
                Client: <span className="text-[#2C2520]">{order.customerName}</span>
              </div>
              <div>
                Email: <span className="text-[#2C2520]">{order.customerEmail}</span>
              </div>
              <div>
                Téléphone: <span className="text-[#2C2520]">{order.customerPhone}</span>
              </div>
              <div>
                Adresse: <span className="text-[#2C2520]">{order.shippingAddress}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {item.product?.image && (
                      <img
                        src={item.product.image}
                        alt={item.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div className="text-[#2C2520]">
                      {item.name} ({item.quantity})
                      {item.optionValue && (
                        <div className="text-xs text-[#6B5D52]">
                          {(item.optionLabel ?? 'Option')}: {item.optionValue}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[#B8936A]">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EEE2D2] mt-4 pt-4 text-right">
              <span className="text-[#2C2520] font-semibold">
                Total: {formatPrice(order.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
