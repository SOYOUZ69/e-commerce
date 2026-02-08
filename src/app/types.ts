export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string;
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
