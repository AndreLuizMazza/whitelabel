// src/lib/nalapide.js
const devBff =
  (import.meta.env.VITE_BFF_BASE || "http://localhost:8787") + "/nalapide";

const BASE = import.meta.env.PROD ? "/api/nalapide" : devBff;

function qs(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

function getTenantSlug() {
  const ds = document?.documentElement?.dataset;
  if (ds?.tenantSlug) return ds.tenantSlug;
  try {
    const ls = localStorage.getItem("TENANT_SLUG");
    if (ls) return ls;
  } catch {}
  return "";
}

async function http(url, init = {}) {
  const tenant = getTenantSlug();

  const r = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(tenant ? { "x-tenant-slug": tenant } : {}),
      ...(init.headers || {}),
    },
  });

  const ct = r.headers.get("content-type") || "";
  const raw = await r.text();

  let body = raw;
  if (ct.includes("application/json")) {
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = raw;
    }
  }

  if (!r.ok) {
    const msg =
      typeof body === "string"
        ? body
        : body?.detail || body?.userMessage || body?.message || body?.title || `HTTP ${r.status}`;

    const err = new Error(msg);
    err.status = r.status;
    err.url = url;
    err.body = body;
    throw err;
  }

  return body;
}

/* =================== MEMORIAL =================== */
export async function listMemorial({ q = "", page = 1, perPage = 12 } = {}) {
  return http(`${BASE}/memorial${qs({ q, page, perPage })}`);
}

export async function getMemorialById(idOrSlug) {
  return http(`${BASE}/memorial/${encodeURIComponent(idOrSlug)}`);
}

/* =================== MÍDIAS =================== */
export async function getMemorialMidias(obitoId) {
  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/midias`);
}

/* =================== INTERAÇÕES =================== */
export async function getMemorialInteracoes(obitoId) {
  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/interacoes`);
}

export async function createMemorialInteracao(obitoId, payload) {
  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/interacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* =================== REAÇÕES =================== */
export async function sendMemorialReaction(obitoId, payload) {
  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* =================== LEADS =================== */
export async function createLead(payload) {
  return http(`${BASE}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
