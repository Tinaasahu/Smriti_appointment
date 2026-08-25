/**
 * Base API Client Configuration
 * Supports switching between live backend endpoints and client mock mode seamlessly.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const USE_MOCK_FALLBACK = true;

export async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.detail || `HTTP Error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      console.warn(`[API Fallback] Request to ${endpoint} failed, utilizing mock service. (${err.message})`);
      return null;
    }
    throw err;
  }
}
