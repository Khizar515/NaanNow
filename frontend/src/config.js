// Centralised API configuration.
// All values come from the root .env file via Vite's import.meta.env.
// To change the backend URL, edit VITE_API_BASE_URL in the root .env file.

export const API_SERVER = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_URL = `${API_SERVER}/api`;

/**
 * Resolves a media path returned by the backend into a full URL.
 * - If the path already starts with "http" it is returned as-is.
 * - Otherwise it is prefixed with the API server origin.
 */
export const resolveMediaUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_SERVER}/${path.replace(/\\/g, '/')}`;
};
