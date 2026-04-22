/** Utilitários compartilhados — catálogo de produtos (vitrine) */

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
