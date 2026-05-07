/** Utilitários compartilhados — catálogo de produtos (vitrine) */

const CATALOG_QUERY_KEYS = ["categoria", "q", "page"];

export const CATALOG_CATEGORIA_VALIDAS = new Set(["URNA", "COROA", "VESTIMENTA", "OUTROS"]);

/**
 * URNA, COROA, VESTIMENTA, OUTROS — aceita uRnA, etc. (NFKC + en-US).
 * @param {string|null|undefined} raw
 * @returns {string} códigos válidos ou `""`
 */
export function normalizeCatalogCategoriaValue(raw) {
  if (raw == null) return "";
  const u = String(raw).normalize("NFKC").trim().toLocaleUpperCase("en-US");
  return CATALOG_CATEGORIA_VALIDAS.has(u) ? u : "";
}

/**
 * Reconstrói a query do catálogo a partir de `location.search` (só categoria, q, page).
 * @param {string} [search] — ex.: `?categoria=URNA&q=foo` ou com `?`
 * @returns {string} `?...` ou `""`
 */
export function buildCatalogListSearchString(search) {
  if (search == null) return "";
  const raw = String(search);
  const q0 = raw.startsWith("?") ? raw.slice(1) : raw;
  if (!q0) return "";
  const p = new URLSearchParams(q0);
  const n = new URLSearchParams();
  for (const k of CATALOG_QUERY_KEYS) {
    if (!p.has(k)) continue;
    const v = p.get(k);
    if (k === "categoria") {
      const c = normalizeCatalogCategoriaValue(v);
      if (c) n.set(k, c);
      continue;
    }
    if (k === "q" && !(v && String(v).trim())) continue;
    n.set(k, v);
  }
  const s = n.toString();
  return s ? `?${s}` : "";
}

/**
 * Destino do item "Produtos" no menu: mantém filtros ao voltar do detalhe (`/produtos/:id?…`) ou na própria lista.
 * @param {string} pathname
 * @param {string} search
 * @returns {import("react-router-dom").To}
 */
export function getProdutosMenuTo(pathname, search) {
  const s = buildCatalogListSearchString(search);
  if (pathname === "/produtos" || (pathname.startsWith("/produtos/") && pathname !== "/produtos")) {
    if (s) return { pathname: "/produtos", search: s };
  }
  return "/produtos";
}

/** Rótulo curto para chips/badges (valores da API: URNA, COROA, …). */
export function formatProdutoCategoriaLabel(categoria) {
  if (!categoria || typeof categoria !== "string") return null;
  const m = {
    URNA: "Urna",
    COROA: "Coroa",
    VESTIMENTA: "Vestimenta",
    OUTROS: "Outros",
  };
  return m[normalizeCatalogCategoriaValue(categoria)] || null;
}

export const PRODUTO_WA_MSG = (nome) =>
  `Olá! Tenho interesse no produto: ${nome}. Pode me passar mais informações?`;

export function formatProdutoBrl(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n));
  } catch {
    return String(n);
  }
}

/** Classe de fonte “sistema” alinhada a vitrines estilo Apple */
export const productShowcaseFontClass =
  "antialiased font-['-apple-system','BlinkMacSystemFont','Segoe_UI',Roboto,Helvetica,'Segoe_UI_Emoji',Arial,sans-serif]";

/**
 * Dados de ERP costumam vir em MAIÚSCULAS. Para títulos de vitrine, converte
 * para formato título legível (estilo Apple: sem gritar com caps lock).
 * @param {string} raw
 * @returns {string}
 */
export function formatProductNameForDisplay(raw) {
  if (raw == null) return "Produto";
  let t = String(raw)
    .trim()
    .replace(/>+[\s.]*$/g, "")
    .trim();
  if (!t) return "Produto";
  const hasLetter = /[A-Za-zÀ-ÿ]/.test(t);
  if (!hasLetter) return t;
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length === 0) return t;
  const upperInLetters = (t.match(/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length;
  if (upperInLetters / letters.length < 0.6) return t;
  return t
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === "") return part;
      if (!/[A-Za-zÀ-ÿ]/.test(part)) return part;
      const first = part.search(/[A-Za-zÀ-ÿ]/);
      if (first === -1) return part;
      return (
        part.slice(0, first) +
        part.charAt(first).toLocaleUpperCase("pt-BR") +
        part.slice(first + 1)
      );
    })
    .join("");
}
