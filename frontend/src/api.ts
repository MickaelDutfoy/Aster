export const API_URL =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export const api = (path: string) =>
  API_URL.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);