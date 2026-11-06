export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku?: string | null;
  price: number;
  originalPrice?: number | null;
  stock?: number;
  status?: string;
  image: string;
  images?: {
    id?: string;
    url: string;
    alt?: string | null;
    isPrimary?: boolean;
    position?: number;
  }[];
  optionLabel?: string | null;
  optionValues?: string[];
  badge?: string | null;
  rating?: number | null;
  category: string;
  shortDescription?: string | null;
  description: string;
  details: string[];
  featured?: boolean;
  trending?: boolean;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  id: string;
  status: string;
  items: CartItem[];
};
