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

/* =========================
   Client-side debug helpers
========================= */
function isDev() {
  return Boolean(import.meta.env?.DEV);
}

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function short(s, n = 220) {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function maskEmail(email) {
  const s = String(email || "").trim();
  if (!s || !s.includes("@")) return "[redacted]";
  const [user, domain] = s.split("@");
  const u = user.length <= 2 ? user[0] + "*" : user.slice(0, 2) + "***";
  return `${u}@${domain}`;
}

function maskPhone(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length < 6) return "[redacted]";
  return `${d.slice(0, 2)}*****${d.slice(-2)}`;
}

function redactPayload(payload) {
  const p = payload || {};
  const out = { ...p };
  if (out.email) out.email = maskEmail(out.email);
  if (out.telefone) out.telefone = maskPhone(out.telefone);
  if (out.mensagem)
    out.mensagem = `[len=${String(out.mensagem).length}] ${short(out.mensagem, 60)}`;
  if (typeof out.nome === "string") out.nome = short(out.nome, 60);
  return out;
}

/* =========================
   CONTRATO ÚNICO: TIPOS (4)
========================= */

const UI_TIPOS = new Set(["MENSAGEM", "VELA", "LIVRO", "FLOR"]);

// compat: aceita legados se algum trecho do app ainda enviar antigo
function normalizeUiTipo(v) {
  const raw = String(v || "").trim();
  if (!raw) return "MENSAGEM";

  const up = raw.toUpperCase();
  if (UI_TIPOS.has(up)) return up;

  const low = raw.toLowerCase().replace(/\s+/g, "_");
  const compat = {
    // novos (lower)
    mensagem: "MENSAGEM",
    vela: "VELA",
    livro: "LIVRO",
    flor: "FLOR",

    // contrato antigo do front
    mensagem_condolencia: "MENSAGEM",
    vela_digital: "VELA",
    livro_digital: "LIVRO",
    flor_digital: "FLOR",

    // upstream antigo (caso algum ponto vaze)
    acender_vela: "VELA",
    livro_visitas: "LIVRO",
    enviar_flor: "FLOR",
  };

  return compat[low] || "MENSAGEM";
}

function validateInteracaoPayload(payload) {
  const nome = String(payload?.nome || "").trim();
  if (!nome) {
    const err = new Error("Informe seu nome para enviar a homenagem.");
    err.status = 400;
    err.code = "NOME_REQUIRED";
    throw err;
  }

  // ✅ hard-guard do tipo (evita “vazar” tipo antigo)
  const tipo = normalizeUiTipo(payload?.tipo);
  if (!UI_TIPOS.has(tipo)) {
    const err = new Error("Tipo de homenagem inválido.");
    err.status = 400;
    err.code = "TIPO_INVALIDO";
    throw err;
  }
}

/* =========================
   HTTP (com timeout + logs)
========================= */
async function http(url, init = {}) {
  const tenant = getTenantSlug();

  const ctrl = new AbortController();
  const timeoutMs = Number(import.meta.env.VITE_HTTP_TIMEOUT_MS || 15000);
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  const method = String(init.method || "GET").toUpperCase();

  const safeBodyPreview = (() => {
    if (!isDev()) return null;
    try {
      if (!init.body) return null;
      const txt =
        typeof init.body === "string" ? init.body : JSON.stringify(init.body);
      return short(txt, 420);
    } catch {
      return null;
    }
  })();

  if (isDev()) {
    console.log(
      `[nalapide.js] ${nowIso()} → ${method} ${url}`,
      tenant ? `| tenant=${tenant}` : "| tenant=-",
      safeBodyPreview ? `| body=${safeBodyPreview}` : ""
    );
  }

  try {
    const r = await fetch(url, {
      ...init,
      signal: init.signal || ctrl.signal,
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
          : body?.detail ||
            body?.userMessage ||
            body?.message ||
            body?.title ||
            `HTTP ${r.status}`;

      const err = new Error(msg);
      err.status = r.status;
      err.url = url;
      err.body = body;

      if (isDev()) {
        console.error(
          `[nalapide.js] ${nowIso()} ← ${method} ${url} ERROR`,
          `| status=${r.status}`,
          `| ct=${ct}`,
          `| msg=${short(msg, 260)}`
        );
      }
      throw err;
    }

    if (isDev()) {
      console.log(
        `[nalapide.js] ${nowIso()} ← ${method} ${url} OK`,
        `| status=${r.status}`,
        `| ct=${ct}`
      );
    }

    return body;
  } catch (e) {
    if (e?.name === "AbortError") {
      const err = new Error(
        "Tempo excedido ao comunicar com o servidor. Tente novamente."
      );
      err.status = 0;
      err.url = url;

      if (isDev()) {
        console.error(
          `[nalapide.js] ${nowIso()} ✖ TIMEOUT ${method} ${url} (${timeoutMs}ms)`
        );
      }
      throw err;
    }

    if (isDev()) {
      console.error(
        `[nalapide.js] ${nowIso()} ✖ EXCEPTION ${method} ${url}`,
        String(e?.message || e)
      );
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
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
  validateInteracaoPayload(payload);

  // ✅ força contrato novo no envio (4 tipos)
  const normalizedPayload = {
    ...payload,
    tipo: normalizeUiTipo(payload?.tipo), // "MENSAGEM"|"VELA"|"LIVRO"|"FLOR"
  };

  if (isDev()) {
    console.log(
      `[nalapide.js] ${nowIso()} createMemorialInteracao`,
      `| obitoId=${obitoId}`,
      `| payload=`,
      redactPayload(normalizedPayload)
    );
  }

  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/interacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizedPayload),
  });
}

/* =================== REAÇÕES =================== */
export async function sendMemorialReaction(obitoId, payload) {
  if (isDev()) {
    console.log(
      `[nalapide.js] ${nowIso()} sendMemorialReaction`,
      `| obitoId=${obitoId}`,
      `| payload=`,
      redactPayload(payload)
    );
  }

  return http(`${BASE}/memorial/${encodeURIComponent(obitoId)}/reactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* =================== LEADS =================== */
export async function createLead(payload) {
  if (isDev()) {
    console.log(
      `[nalapide.js] ${nowIso()} createLead`,
      `| payload=`,
      redactPayload(payload)
    );
  }

  return http(`${BASE}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
