import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { customerCheckout } from '../api/auth';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import { formatPrice } from '../utils/format';

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapPicker = ({
  position,
  onSelect,
}: {
  position: { lat: number; lon: number } | null;
  onSelect: (lat: number, lon: number) => void;
}) => {
  const center = position ?? { lat: 36.8065, lon: 10.1815 };

  const ClickHandler = () => {
    useMapEvents({
      click: (event) => {
        onSelect(event.latlng.lat, event.latlng.lng);
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={13}
      style={{ height: 320, width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && <Marker position={[position.lat, position.lon]} />}
      <ClickHandler />
    </MapContainer>
  );
};

export const Checkout = () => {
  const navigate = useNavigate();
  const { customer, loading, refresh } = useAuth();
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !customer) {
      navigate('/account/login?returnTo=/checkout');
    }
  }, [customer, loading, navigate]);

  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || customer.firstName,
        lastName: prev.lastName || customer.lastName,
        phone: prev.phone || customer.phone || '',
        address: prev.address || customer.address || '',
      }));
    }
  }, [customer]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          addressdetails: '1',
          limit: '6',
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`
        );
        const data = (await response.json()) as SearchResult[];
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  const cartItems = useMemo(
    () => items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    [items]
  );

  const total = subtotal;

  const fetchReverseGeocode = async (lat: number, lon: number) => {
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(lat),
        lon: String(lon),
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
      );
      const data = await response.json();
      if (data?.display_name) {
        setForm((prev) => ({ ...prev, address: data.display_name }));
      }
    } catch {
      // ignore
    }
  };

  if (!customer && !loading) {
    return null;
  }

  return (
    <section className="py-16 bg-[#FAF8F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-3xl text-[#2C2520] mb-6">Finaliser la commande</h1>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setSubmitting(true);
                setError(null);
                try {
                  const order = await customerCheckout({
                    items: cartItems,
                    address: form.address,
                    phone: form.phone,
                    notes: form.notes || undefined,
                    firstName: form.firstName,
                    lastName: form.lastName,
                  });
                  await refresh();
                  clear();
                  navigate(`/order-confirmed?orderId=${encodeURIComponent(order.id)}`);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Checkout failed');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={form.firstName}
                  onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  placeholder="Prénom"
                  className="border border-[#B8936A] px-3 py-2"
                  required
                />
                <input
                  value={form.lastName}
                  onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Nom"
                  className="border border-[#B8936A] px-3 py-2"
                  required
                />
              </div>
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Téléphone"
                className="border border-[#B8936A] px-3 py-2 w-full"
                required
              />

              <div>
                <label className="text-sm text-[#6B5D52]">Recherche d'adresse</label>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher votre adresse..."
                  className="border border-[#B8936A] px-3 py-2 w-full mt-1"
                />
                {searching && (
                  <p className="text-sm text-[#6B5D52] mt-2">Recherche...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="border border-[#EEE2D2] rounded-lg mt-2 overflow-hidden">
                    {searchResults.map((result) => (
                      <button
                        type="button"
                        key={`${result.lat}-${result.lon}`}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, address: result.display_name }));
                          setPosition({ lat: Number(result.lat), lon: Number(result.lon) });
                          setShowMap(true);
                          setSearchResults([]);
                          setQuery('');
                        }}
                        className="block w-full text-left px-3 py-2 hover:bg-[#FAF8F3]"
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Adresse complète"
                className="border border-[#B8936A] px-3 py-2 w-full min-h-[120px]"
                required
              />

              <div>
                <button
                  type="button"
                  onClick={() => setShowMap((prev) => !prev)}
                  className="text-sm text-[#B8936A]"
                >
                  {showMap ? 'Masquer la carte' : 'Choisir sur la carte'}
                </button>
                {showMap && (
                  <div className="mt-3">
                    <MapPicker
                      position={position}
                      onSelect={async (lat, lon) => {
                        setPosition({ lat, lon });
                        await fetchReverseGeocode(lat, lon);
                      }}
                    />
                    <p className="text-xs text-[#6B5D52] mt-2">
                      Cliquez sur la carte pour choisir votre emplacement.
                    </p>
                  </div>
                )}
              </div>

              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notes de livraison (optionnel)"
                className="border border-[#B8936A] px-3 py-2 w-full min-h-[80px]"
              />

              <button
                className="w-full bg-[#2C2520] text-white px-4 py-3"
                disabled={submitting || items.length === 0}
              >
                {submitting ? 'Envoi...' : 'Confirmer la commande'}
              </button>
            </form>
          </div>

          <aside className="w-full lg:w-96 bg-white rounded-2xl p-6 shadow-sm h-fit">
            <h2 className="text-xl text-[#2C2520] mb-4">Résumé</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-14 w-14 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-[#2C2520]">{item.product.name}</p>
                    <p className="text-xs text-[#6B5D52]">
                      {item.quantity} × {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <span className="text-[#B8936A]">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#EEE2D2] mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[#6B5D52]">Total</span>
                <span className="text-xl text-[#2C2520]">{formatPrice(total)}</span>
              </div>
            </div>
            {items.length === 0 && (
              <div className="mt-4 text-sm text-[#6B5D52]">
                Votre panier est vide.{' '}
                <Link to="/products" className="text-[#B8936A]">
                  Retour à la boutique
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};
