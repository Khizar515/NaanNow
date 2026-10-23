// Centralised API configuration.
// All values come from the root .env file via Vite's import.meta.env.
// If VITE_API_BASE_URL is not set or points to localhost while deployed on a domain,
// we intelligently fall back to the live domain API.

const resolveApiServer = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // If explicitly configured with a live URL (e.g. https://naannow-api.ksdev.me)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  // If running in browser on a deployed domain (like naannow.ksdev.me)
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.location.hostname.endsWith('ksdev.me')) {
      return `${window.location.protocol}//naannow-api.ksdev.me`;
    }
    return `${window.location.protocol}//${window.location.hostname.replace(/^([^\.]+)/, '$1-api')}`;
  }

  // Local fallback
  return envUrl || 'http://localhost:5001';
};

export const API_SERVER = resolveApiServer();
export const API_URL = `${API_SERVER}/api`;

/**
 * Resolves a media path returned by the backend into a full URL.
 * - If the path contains a hardcoded localhost/127.0.0.1 (from DB backup/seed),
 *   it rewrites it to use the current API_SERVER.
 * - If the path is already a valid external http(s) URL (like unsplash), it is returned as-is.
 * - Otherwise it is prefixed with the API server origin.
 */
export const resolveMediaUrl = (path) => {
  if (!path) return null;
  // Rewrite localhost:5000 or localhost:5001 stored in DB to API_SERVER
  let resolved = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, API_SERVER);
  if (resolved.startsWith('http')) return resolved;
  return `${API_SERVER}/${resolved.replace(/^\//, '').replace(/\\/g, '/')}`;
};
