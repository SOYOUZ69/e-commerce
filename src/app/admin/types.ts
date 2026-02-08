export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  sku?: string | null;
  stock?: number | null;
  status?: string | null;
  image: string;
  badge?: string | null;
  rating?: number | null;
  shortDescription?: string | null;
  description: string;
  details?: string[] | null;
  categoryId: string;
};

export type FeatureItem = {
  id: string;
  title: string;
  description: string;
  iconKey?: string | null;
  position: number;
  isActive: boolean;
};

export type PromoBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  themeColor?: string | null;
  position: number;
  isActive: boolean;
};

export type HomeCategory = {
  id: string;
  categoryId: string;
  position: number;
  isActive: boolean;
  category?: Category;
};

export type HomeProduct = {
  id: string;
  productId: string;
  type: string;
  position: number;
  isActive: boolean;
  product?: Product;
};

export type SocialLink = {
  id: string;
  label: string;
  url: string;
  iconKey: string;
  position: number;
  isActive: boolean;
};

export type PaymentBadge = {
  id: string;
  label: string;
  imageUrl: string;
  position: number;
  isActive: boolean;
};

export type SiteSettings = {
  logoUrl?: string | null;
  announcementText?: string | null;
  announcementEnabled?: boolean;
  newsletterText?: string | null;
  newsletterEnabled?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
};

export type HeroSection = {
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  badgeText?: string | null;
  isActive?: boolean;
};
