import { useEffect, useState } from 'react';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../api/client';

type SocialLink = {
  id: string;
  label: string;
  url: string;
  iconKey: string;
};

type PaymentBadge = {
  id: string;
  label: string;
  imageUrl: string;
};

export function Footer() {
  const [logoUrl, setLogoUrl] = useState('/images/logoespace.webp');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [paymentBadges, setPaymentBadges] = useState<PaymentBadge[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, socials, badges] = await Promise.all([
          fetchJson('/api/settings'),
          fetchJson('/api/social-links'),
          fetchJson('/api/payment-badges'),
        ]);
        if (settings.logoUrl) {
          setLogoUrl(settings.logoUrl);
        }
        setSocialLinks(socials);
        setPaymentBadges(badges);
      } catch {
        setLogoUrl('/images/logoespace.webp');
      }
    };
    load();
  }, []);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
  };

  return (
    <footer className="bg-[#2C2520] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link to="/">
              <img src={logoUrl} alt="Espace Mariage" className="h-16 w-16 mb-4" />
            </Link>
            <p className="text-white/70 mb-6 max-w-sm">
              Découvrez l’élégance intemporelle d’Espace Mariage, une sélection raffinée de pièces pensées pour sublimer vos instants précieux.
            </p>
            <div className="flex gap-4">
              {socialLinks.length === 0 && (
                <>
                  <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#B8936A] transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#B8936A] transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#B8936A] transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#B8936A] transition-colors">
                    <Youtube className="w-5 h-5" />
                  </a>
                </>
              )}
              {socialLinks.map((link) => {
                const Icon = iconMap[link.iconKey.toLowerCase()] ?? Facebook;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    className="bg-white/10 p-2 rounded-full hover:bg-[#B8936A] transition-colors"
                    aria-label={link.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">Accès rapide</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Notre Maison
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Boutique
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg mb-4">Service client</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Livraison
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Retours
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Guide des tailles
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Suivi de commande
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg mb-4">Informations légales</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Conditions générales
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Politique des cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-[#B8936A] transition-colors">
                  Accessibilité
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © 2025 Espace Mariage. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              {paymentBadges.length === 0 && (
                <>
                  <img src="https://via.placeholder.com/50x30/B8936A/FFFFFF?text=VISA" alt="Visa" className="h-8 rounded" />
                  <img src="https://via.placeholder.com/50x30/B8936A/FFFFFF?text=MC" alt="Mastercard" className="h-8 rounded" />
                  <img src="https://via.placeholder.com/50x30/B8936A/FFFFFF?text=AMEX" alt="Amex" className="h-8 rounded" />
                  <img src="https://via.placeholder.com/50x30/B8936A/FFFFFF?text=PYPL" alt="PayPal" className="h-8 rounded" />
                </>
              )}
              {paymentBadges.map((badge) => (
                <img key={badge.id} src={badge.imageUrl} alt={badge.label} className="h-8 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
