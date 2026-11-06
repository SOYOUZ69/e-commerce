const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const SITE_URL = trimTrailingSlash(
  import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
);

export const META_CURRENCY = String(import.meta.env.VITE_META_CURRENCY || 'TND')
  .trim()
  .toUpperCase();

export const META_BRAND = String(import.meta.env.VITE_META_BRAND || 'Espace Mariage').trim();

export const buildProductUrl = (slug: string) =>
  `${SITE_URL}/product/${encodeURIComponent(String(slug || '').trim())}`;

export const toAbsoluteUrl = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return '';
  }
  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(trimmed, `${SITE_URL}/`).toString();
    } catch {
      return trimmed;
    }
  }
};
