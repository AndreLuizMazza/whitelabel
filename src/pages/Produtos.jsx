// Catálogo vitrine — 2 colunas (mobile+), hierarquia tipográfica fina, CTA discretos
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ImageOff, MessageCircle } from "lucide-react";
import api from "@/lib/api.js";
import useTenant from "@/store/tenant";
import { buildWaHref, resolveTenantPhone, resolveGlobalFallback } from "@/lib/whats.js";
import {
  PRODUTO_WA_MSG,
  formatProdutoBrl,
  productShowcaseFontClass,
  formatProductNameForDisplay,
} from "@/lib/produtoUtils.js";

function ProdutoImage({ src, alt = "" }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2.5"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--surface-alt) 100%, #888 0%) 0%, color-mix(in srgb, var(--surface) 88%, var(--c-border) 12%) 100%)",
        }}
        role="img"
        aria-label="Sem fotografia do produto"
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            background: "color-mix(in srgb, var(--c-border) 28%, transparent)",
            color: "var(--text-muted)",
          }}
        >
          <ImageOff className="h-5 w-5 opacity-55" strokeWidth={1.25} aria-hidden />
        </div>
        <span
          className="text-[10px] sm:text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--text-muted)]/70"
        >
          Foto
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.025]"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function Produtos() {
  const empresa = useTenant((s) => s.empresa);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const phoneBase = useMemo(() => {
    return (resolveTenantPhone(empresa) || resolveGlobalFallback() || "").toString();
  }, [empresa]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/v1/produtos", { validateStatus: () => true });
      if (res.status === 204) {
        setItems([]);
      } else if (res.status === 200) {
        const data = res.data;
        setItems(Array.isArray(data) ? data : []);
      } else {
        setError("Não foi possível carregar os produtos.");
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || e?.message || "Erro desconhecido";
      setError("Não foi possível carregar os produtos: " + msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={`min-h-[50vh] ${productShowcaseFontClass}`}>
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20">
          <div className="h-6 sm:h-8 w-32 sm:w-40 animate-pulse rounded-full bg-[var(--surface-alt)] mx-auto" />
          <div className="mt-3 h-3 w-48 max-w-full mx-auto animate-pulse rounded-full bg-[var(--surface-alt)]" />
          <div className="mt-10 sm:mt-12 grid grid-cols-2 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[1.1rem] sm:rounded-3xl ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)]"
              >
                <div className="aspect-[3/4] animate-pulse bg-[var(--surface-alt)]" />
                <div className="p-2.5 sm:p-4 space-y-2">
                  <div className="h-3 w-full max-w-[90%] rounded bg-[var(--surface-alt)]" />
                  <div className="h-3 w-1/2 rounded bg-[var(--surface-alt)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`section py-10 ${productShowcaseFontClass}`}>
        <div className="container-max">
          <p className="text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${productShowcaseFontClass} selection:bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]`}>
      <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-[4.5rem] pb-14 sm:pb-20">
        <header className="text-center max-w-lg mx-auto mb-9 sm:mb-12 md:mb-16 px-1">
          <p className="text-[0.7rem] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)]/90">
            Catálogo
          </p>
          <h1 className="mt-2 text-[1.65rem] sm:text-4xl md:text-[2.4rem] font-semibold tracking-[-0.038em] leading-[1.05] text-[var(--text)]">
            Produtos
          </h1>
          <p className="mt-3 text-[0.9rem] sm:text-base text-[var(--text-muted)] font-normal leading-relaxed tracking-[-0.01em]">
            Toque num item para abrir. WhatsApp, quando disponível, fica no fim do cartão.
          </p>
        </header>

        {items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-20 text-sm sm:text-base">
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <ul className="m-0 list-none p-0 grid grid-cols-2 gap-3 min-[480px]:gap-4 sm:gap-6 md:gap-8">
            {items.map((p) => {
              const rawName = p?.nome || "Produto";
              const nome = formatProductNameForDisplay(rawName);
              const preco = p?.preco != null ? formatProdutoBrl(p.preco) : null;
              const hrefWa = buildWaHref({
                number: phoneBase,
                message: PRODUTO_WA_MSG(rawName),
              });
              return (
                <li key={p.id} className="min-w-0 flex">
                  <article
                    className="group flex w-full min-h-0 flex-col overflow-hidden rounded-[1.1rem] sm:rounded-3xl bg-[var(--surface)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_100%,transparent)]"
                    style={{
                      boxShadow:
                        "0 1px 0 0 color-mix(in srgb, var(--c-border) 45%, transparent), 0 18px 48px -24px color-mix(in srgb, #000 18%, transparent)",
                    }}
                  >
                    <Link
                      to={`/produtos/${p.id}`}
                      className="flex min-h-0 flex-1 flex-col min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/45"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--surface-alt)]">
                        <ProdutoImage src={p?.imagem} alt={nome} />
                      </div>
                      <div className="flex flex-1 flex-col px-2.5 pt-2.5 pb-2 min-[480px]:px-4 min-[480px]:pt-3.5 min-[480px]:pb-3 sm:px-5 sm:pt-4 sm:pb-3.5">
                        <h2
                          className="text-left text-[0.8rem] min-[400px]:text-sm sm:text-[0.95rem] md:text-base font-medium leading-snug text-[var(--text)] tracking-[-0.02em] line-clamp-2 normal-case [overflow-wrap:anywhere] hyphens-auto"
                          style={{ fontWeight: 500 }}
                        >
                          {nome}
                        </h2>
                        {preco ? (
                          <p
                            className="mt-1.5 min-[400px]:mt-2 text-[0.8rem] min-[400px]:text-sm sm:text-[0.9rem] md:text-base tabular-nums tracking-[-0.02em] text-[var(--text)]"
                            style={{ fontFeatureSettings: '"tnum"' }}
                          >
                            {preco}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[0.7rem] sm:text-xs text-[var(--text-muted)]/90">
                            Sob consulta
                          </p>
                        )}
                      </div>
                    </Link>
                    {hrefWa ? (
                      <a
                        href={hrefWa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto flex w-full min-h-[2.5rem] sm:min-h-11 items-center justify-center gap-1.5 border-t text-[0.7rem] min-[400px]:text-sm font-medium text-[var(--text)]/80 transition-colors hover:text-[var(--text)]"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--c-border) 55%, transparent)",
                          background:
                            "color-mix(in srgb, var(--surface-alt) 40%, var(--surface) 60%)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle
                          className="h-3.5 w-3.5 min-[400px]:h-4 min-[400px]:w-4 text-[#25D366] opacity-90"
                          aria-hidden
                        />
                        <span className="tracking-[-0.01em]">WhatsApp</span>
                      </a>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {!items.length
          ? null
          : !phoneBase ? (
              <p className="text-center text-[0.7rem] sm:text-xs text-[var(--text-muted)]/90 mt-8 max-w-sm mx-auto leading-relaxed">
                Com telefone da unidade configurado, o WhatsApp aparece no fim de cada cartão.
              </p>
            ) : null}
      </div>
    </div>
  );
}
