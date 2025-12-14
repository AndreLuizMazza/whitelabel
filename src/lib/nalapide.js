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

async function http(url, init = {}) {
  const r = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });

  const ct = r.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await r.json() : await r.text();

  if (!r.ok) {
    throw new Error(
      typeof body === "string" ? body : body?.message || "Erro na API NaLápide"
    );
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

/* =================== MÍDIAS (GALERIA) =================== */

export async function getMemorialMidias(obitoId) {
  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/midias`);
}

/* =================== INTERAÇÕES (MENSAGENS) =================== */

export async function getMemorialInteracoes(obitoId) {
  // BFF: GET /memorial/:id/interacoes  -> upstream: /interacoes/por-obito/:id
  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/interacoes`);
}

export async function createMemorialInteracao(obitoId, payload) {
  // BFF: POST /memorial/:id/interacoes -> upstream: /interacoes
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
