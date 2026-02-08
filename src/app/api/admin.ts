import { API_BASE_URL } from './client';

const TOKEN_KEY = 'admin_token';

export const getAdminToken = () =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);

export const setAdminToken = (token: string) => {
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearAdminToken = () => {
  window.localStorage.removeItem(TOKEN_KEY);
};

const adminFetch = async (path: string, options?: RequestInit) => {
  const token = getAdminToken();
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

export const adminLogin = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Login failed');
  }

  return response.json();
};

export const adminGet = (path: string) => adminFetch(path);
export const adminPost = (path: string, body: unknown) =>
  adminFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const adminPatch = (path: string, body: unknown) =>
  adminFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
export const adminPut = (path: string, body: unknown) =>
  adminFetch(path, { method: 'PUT', body: JSON.stringify(body) });
export const adminDelete = (path: string) =>
  adminFetch(path, { method: 'DELETE' });

export const adminUpload = async (file: File) => {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/api/admin/uploads`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    let message = 'Upload failed';
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
