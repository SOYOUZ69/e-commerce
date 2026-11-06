export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const fetchJson = async (path: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Le catalogue change depuis l'admin : on veut toujours la version a jour,
    // jamais une reponse ressortie du cache du navigateur.
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'La requête a échoué');
  }

  return response.json();
};
