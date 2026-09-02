const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
let accessToken = null;
let refreshPromise = null;
let authFailureHandler = () => {};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const setAuthFailureHandler = (handler) => { authFailureHandler = handler || (() => {}); };

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.data?.accessToken) throw new ApiError(payload?.message || 'Session expired', response.status);
        setAccessToken(payload.data.accessToken);
        return payload;
      }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiRequest(path, options = {}, hasRetried = false) {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/refresh');
    if (response.status === 401 && !hasRetried && !isAuthEndpoint) {
      try {
        await refreshAccessToken();
        return apiRequest(path, options, true);
      } catch {
        setAccessToken(null);
        authFailureHandler();
      }
    }
    throw new ApiError(
      payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.errors,
    );
  }

  return payload;
}

export { refreshAccessToken };

export const api = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => apiRequest(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  patch: (path, body, options = {}) => apiRequest(path, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  delete: (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' }),
};

export default api;
