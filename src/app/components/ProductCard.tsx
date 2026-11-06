import { Heart, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { useCart } from '../store/cart';
import { formatPrice } from '../utils/format';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { name, price, originalPrice, image, badge, rating = 5, slug } = product;
  const hasOptions = (product.optionValues ?? []).length > 0;
  return (
    <Link
      to={`/product/${slug}`}
      className="group relative bg-white rounded-lg overflow-hidden block"
      aria-label={`Voir ${name}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-[#FAF8F3]">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        
        {/* Badge */}
        {badge && (
          <span className="absolute top-4 left-4 bg-[#B8936A] text-white px-3 py-1 text-sm uppercase tracking-wide">
            {badge}
          </span>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            className="bg-white text-[#2C2520] p-3 rounded-full hover:bg-[#B8936A] hover:text-white transition-colors"
          >
            <Heart className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (hasOptions) {
                navigate(`/product/${slug}`);
                return;
              }
              addItem(product, 1);
            }}
            className="bg-white text-[#2C2520] p-3 rounded-full hover:bg-[#B8936A] hover:text-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${i < rating ? 'text-[#B8936A]' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        
        <span className="text-[#2C2520] mb-2 block group-hover:text-[#B8936A] transition-colors">
          {name}
        </span>
        
        <div className="flex items-center gap-2">
          <span className="text-[#B8936A]">{formatPrice(price)}</span>
          {originalPrice && (
            <span className="text-gray-400 line-through text-sm">{formatPrice(originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
