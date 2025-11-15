// src/lib/api/client.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Errore HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export { API_BASE_URL, apiFetch };
