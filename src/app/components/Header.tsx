import { Search, ShoppingCart, Heart, User, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { fetchJson } from '../api/client';
import { useCatalog } from '../store/catalog';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import { formatPrice } from '../utils/format';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [logoUrl, setLogoUrl] = useState('/images/reflet d’art (1).webp');
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const { cartCount } = useCart();
  const { customer } = useAuth();
  const { products } = useCatalog();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[#2C2520] hover:text-[#B8936A] transition-colors ${isActive ? 'text-[#B8936A]' : ''}`;

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await fetchJson('/api/settings');
        if (settings.logoUrl) {
          setLogoUrl(settings.logoUrl);
        }
        if (settings.announcementEnabled && settings.announcementText) {
          setAnnouncement(settings.announcementText);
        }
      } catch {
        setLogoUrl('/images/reflet d’art (1).webp');
      }
    };
    load();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults =
    normalizedQuery.length < 2
      ? []
      : products.filter((product) => {
          const name = product.name.toLowerCase();
          const description = product.description.toLowerCase();
          const shortDescription = (product.shortDescription ?? '').toLowerCase();
          return (
            name.includes(normalizedQuery) ||
            description.includes(normalizedQuery) ||
            shortDescription.includes(normalizedQuery)
          );
        });

  return (
    <>
      {/* Top Announcement Bar */}
      {announcement && (
        <div className="bg-[#B8936A] text-white py-2 text-center">
          <p className="text-sm">{announcement}</p>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-[#2C2520]"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/">
                <img src={logoUrl} alt="Reflet d'art" className="h-20 w-20" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <NavLink to="/products" className={navLinkClass}>
                Shop
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                About
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className="p-2 text-[#2C2520] hover:text-[#B8936A] transition-colors hidden sm:block"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link
                to={
                  customer
                    ? '/account/profile'
                    : `/account/login?returnTo=${encodeURIComponent('/account/profile')}`
                }
                className="p-2 text-[#2C2520] hover:text-[#B8936A] transition-colors hidden sm:block"
                aria-label={customer ? 'Compte' : 'Se connecter'}
              >
                <User className="w-5 h-5" />
              </Link>
              <button className="p-2 text-[#2C2520] hover:text-[#B8936A] transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <Link
                to="/cart"
                className="p-2 text-[#2C2520] hover:text-[#B8936A] transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-[#B8936A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-3">
                <button
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                  className="text-left text-[#2C2520] hover:text-[#B8936A] transition-colors"
                >
                  Rechercher
                </button>
                <Link
                  to="/products"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#2C2520] hover:text-[#B8936A] transition-colors"
                >
                  Shop
                </Link>
                <Link
                  to="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#2C2520] hover:text-[#B8936A] transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#2C2520] hover:text-[#B8936A] transition-colors"
                >
                  Contact
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#2C2520] hover:text-[#B8936A] transition-colors"
                >
                  Panier ({cartCount})
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {isSearchOpen && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un produit..."
                className="flex-1 border border-[#B8936A] px-4 py-2"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setQuery('');
                }}
                className="text-sm text-[#6B5D52]"
              >
                Fermer
              </button>
            </div>

            {normalizedQuery.length >= 2 && (
              <div className="mt-4 space-y-2">
                {searchResults.length === 0 && (
                  <p className="text-sm text-[#6B5D52]">Aucun resultat.</p>
                )}
                {searchResults.slice(0, 8).map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setQuery('');
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#FAF8F3]"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-[#2C2520]">{product.name}</p>
                      <p className="text-xs text-[#6B5D52]">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
