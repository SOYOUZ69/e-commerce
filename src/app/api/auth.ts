import { API_BASE_URL } from './client';

const TOKEN_KEY = 'customer_token';

export const getCustomerToken = () =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);

export const setCustomerToken = (token: string) => {
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearCustomerToken = () => {
  window.localStorage.removeItem(TOKEN_KEY);
};

const authFetch = async (path: string, options?: RequestInit) => {
  const token = getCustomerToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
};

export const customerRegister = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}) =>
  authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const customerLogin = (payload: { email: string; password: string }) =>
  authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const customerMe = () => authFetch('/api/auth/me');

export const customerCheckout = (payload: {
  items: Array<{ productId: string; quantity: number }>;
  address: string;
  phone?: string;
  notes?: string;
  firstName?: string;
  lastName?: string;
}) =>
  authFetch('/api/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const customerOrders = () => authFetch('/api/orders/mine');

export const customerOrderById = (orderId: string) =>
  authFetch(`/api/orders/mine/${orderId}`);

export const customerUpdateProfile = (payload: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}) =>
  authFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
