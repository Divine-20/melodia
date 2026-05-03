const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE) return `${API_BASE}${p}`;
  return `${window.location.origin}${p}`;
}

export async function apiFetch<T>(
  path: string,
  opts: {
    method?: HttpMethod;
    body?: unknown;
    token?: string | null;
    params?: Record<string, string | number | undefined | null>;
  } = {},
): Promise<T> {
  const url = new URL(resolveUrl(path));
  if (opts.params) {
    Object.entries(opts.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }
  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    let msg = res.statusText;
    const d = data?.detail;
    if (typeof d === "string") msg = d;
    else if (Array.isArray(d))
      msg = d.map((x: { msg?: string }) => x.msg ?? JSON.stringify(x)).join("; ");
    throw new Error(msg);
  }
  return data as T;
}
