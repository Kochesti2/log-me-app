// src/lib/api/client.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  { method: 'GET', path: '/logs' }
];

function isPublicEndpoint(path: string, method: string = 'GET'): boolean {
  return PUBLIC_ENDPOINTS.some(
    endpoint => endpoint.method === method && path.startsWith(endpoint.path)
  );
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const method = options?.method || 'GET';
  const isPublic = isPublicEndpoint(path, method);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  // Only add Authorization header if not a public endpoint and token exists
  if (token && !isPublic) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Only redirect on 401 for non-public endpoints
  if (res.status === 401 && !isPublic) {
    if (typeof window !== 'undefined') {
      // Avoid redirect loops if already on login page
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Errore HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export { API_BASE_URL, apiFetch };
