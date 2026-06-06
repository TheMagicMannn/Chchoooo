const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  domains: {
    list: () => apiFetch("/domains"),
    create: (domain: string) =>
      apiFetch("/domains", { method: "POST", body: JSON.stringify({ domain }) }),
    delete: (id: number) =>
      apiFetch(`/domains/${id}`, { method: "DELETE" }),
    verify: (id: number) =>
      apiFetch(`/domains/${id}/verify`),
  },
  tokens: {
    list: () => apiFetch("/tokens"),
    create: (label?: string) =>
      apiFetch("/tokens", { method: "POST", body: JSON.stringify({ label: label || "default" }) }),
    delete: (id: number) =>
      apiFetch(`/tokens/${id}`, { method: "DELETE" }),
  },
  dashboard: {
    stats: () => apiFetch("/dashboard/stats"),
    logs: (limit = 50, offset = 0) =>
      apiFetch(`/dashboard/logs?limit=${limit}&offset=${offset}`),
  },
  analytics: {
    overview: (range = "7d") => apiFetch(`/analytics/overview?range=${range}`),
    hourly: (range = "7d") => apiFetch(`/analytics/hourly?range=${range}`),
    geo: (range = "7d") => apiFetch(`/analytics/geo?range=${range}`),
    breakdown: (range = "7d") => apiFetch(`/analytics/breakdown?range=${range}`),
    recentSessions: (limit = 10) => apiFetch(`/analytics/recent-sessions?limit=${limit}`),
  },
  webhooks: {
    list: () => apiFetch("/webhooks"),
    create: (data: { url: string; events: string }) =>
      apiFetch("/webhooks", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/webhooks/${id}`, { method: "DELETE" }),
    toggle: (id: number, enabled: boolean) =>
      apiFetch(`/webhooks/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
    test: (id: number) => apiFetch(`/webhooks/${id}/test`, { method: "POST" }),
  },
  alerts: {
    list: () => apiFetch("/alerts"),
    stats: () => apiFetch("/alerts/stats"),
    create: (data: { name: string; condition: string; threshold: number; domain?: string; action: string }) =>
      apiFetch("/alerts", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/alerts/${id}`, { method: "DELETE" }),
    toggle: (id: number, enabled: boolean) =>
      apiFetch(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  },
  billing: {
    usage: () => apiFetch("/billing/usage"),
  },
  stripe: {
    prices: () => apiFetch("/stripe/prices"),
    checkout: (priceId: string) =>
      apiFetch("/stripe/checkout", { method: "POST", body: JSON.stringify({ priceId }) }),
    portal: () =>
      apiFetch("/stripe/portal", { method: "POST" }),
  },
};
