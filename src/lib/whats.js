// src/lib/whats.js
// Utilitários centralizados para WhatsApp

/** Mantém apenas dígitos */
export function onlyDigits(v = "") {
  return String(v).replace(/\D+/g, "");
}

/** Normaliza telefone para DDI 55 + número BR */
export function normalizePhoneToBR(num) {
  const digits = onlyDigits(num);
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/**
 * Monta href do WhatsApp (wa.me) com mensagem opcional.
 * Retorna string vazia se não tiver número.
 */
export function buildWaHref({ number, message } = {}) {
  const normalized = normalizePhoneToBR(number || "");
  if (!normalized) return "";
  const qs = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${qs}`;
}

/** Tenta abrir em nova aba, com fallback para mesma aba se popup bloquear */
export function openWhatsAppUrl(url) {
  if (!url) return;
  try {
    const win = window.open(url, "_blank", "noopener");
    if (!win || win.closed || typeof win.closed === "undefined") {
      // provável bloqueio; cai para mesma aba
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}

/** Lê telefone do tenant (empresa?.contato?.telefone) */
export function resolveTenantPhone(empresa) {
  return empresa?.contato?.telefone || "";
}

/** Fallback global via env/variável global */
export function resolveGlobalFallback() {
  const env = (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHATSAPP) || "";
  const g = (typeof window !== "undefined" && window.__WHATSAPP__) || "";
  return env || g || "";
}
