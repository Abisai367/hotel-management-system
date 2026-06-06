export function getApiUrl() {
  const envApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
  if (envApiUrl) {
    return envApiUrl;
  }

  if (import.meta.env.MODE === 'development') {
    return '/api';
  }

  const clientBase = import.meta.env.BASE_URL || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const normalizedBase = clientBase.endsWith('/') ? clientBase : `${clientBase}/`;
  return `${normalizedBase}api`.replace(/\/+/g, '/');
}
