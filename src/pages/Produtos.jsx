// Catálogo vitrine — 2 colunas, lista paginada (API: page, size)
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ImageOff, MessageCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import api from "@/lib/api.js";
import useTenant from "@/store/tenant";
import { buildWaHref, resolveTenantPhone, resolveGlobalFallback } from "@/lib/whats.js";
import {
  PRODUTO_WA_MSG,
  formatProdutoBrl,
  productShowcaseFontClass,
  formatProductNameForDisplay,
  formatProdutoCategoriaLabel,
  buildCatalogListSearchString,
  normalizeCatalogCategoriaValue,
} from "@/lib/produtoUtils.js";

const PAGE_SIZE = 12;

const CATEGORIA_FILTERS = [
  { value: "", label: "Todos" },
  { value: "URNA", label: "Urnas" },
  { value: "COROA", label: "Coroas" },
  { value: "VESTIMENTA", label: "Vestimenta" },
  { value: "OUTROS", label: "Outros" },
];

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

function parsePage0(raw) {
  const n = parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

export default function Produtos() {
  const empresa = useTenant((s) => s.empresa);
  const [searchParams, setSearchParams] = useSearchParams();
  const page0 = useMemo(
    () => parsePage0(searchParams.get("page")),
    [searchParams]
  );

  const categoriaParam = useMemo(
    () => normalizeCatalogCategoriaValue(searchParams.get("categoria")),
    [searchParams]
  );

  const qParam = useMemo(
    () => (searchParams.get("q") || "").trim(),
    [searchParams]
  );

  /** Repete na rota de detalhe para "Voltar" e o menu trazerem a mesma lista. */
  const catalogListSearch = useMemo(
    () => buildCatalogListSearchString("?" + searchParams.toString()),
    [searchParams]
  );

  const [qInput, setQInput] = useState(() => (searchParams.get("q") || "").trim());
  const qDebounceRef = useRef(null);

  useEffect(() => {
    setQInput((searchParams.get("q") || "").trim());
  }, [searchParams]);

  useEffect(
    () => () => {
      if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    },
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [empty, setEmpty] = useState(true);
  const [apiPage, setApiPage] = useState(0);
  const loadSeq = useRef(0);

  const phoneBase = useMemo(() => {
    return (resolveTenantPhone(empresa) || resolveGlobalFallback() || "").toString();
  }, [empresa]);

  const goToPage = useCallback(
    (next0) => {
      const p = Math.max(0, next0);
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (p <= 0) n.delete("page");
          else n.set("page", String(p));
          return n;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setCategoriaFilter = useCallback(
    (value) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (!value) n.delete("categoria");
          else n.set("categoria", value);
          n.delete("page");
          return n;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const onSearchInputChange = useCallback(
    (e) => {
      const v = e.target.value;
      setQInput(v);
      if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
      qDebounceRef.current = setTimeout(() => {
        qDebounceRef.current = null;
        const t = v.trim();
        setSearchParams(
          (prev) => {
            const n = new URLSearchParams(prev);
            if (!t) n.delete("q");
            else n.set("q", t);
            n.delete("page");
            return n;
          },
          { replace: true }
        );
      }, 400);
    },
    [setSearchParams]
  );

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError("");
    try {
      const params = { page: page0, size: PAGE_SIZE };
      if (categoriaParam) params.categoria = categoriaParam;
      if (qParam) params.q = qParam;
      const res = await api.get("/api/v1/produtos", {
        params,
        validateStatus: () => true,
      });
      if (seq !== loadSeq.current) return;
      if (res.status === 200) {
        const d = res.data;
        if (d == null) {
          setError("Resposta inválida.");
          setItems([]);
          return;
        }
        if (Array.isArray(d)) {
          setItems(d);
          setTotalPages(1);
          setTotalElements(d.length);
          setEmpty(d.length === 0);
          setApiPage(0);
        } else {
          if (
            typeof d.totalElements === "number" &&
            d.totalElements > 0 &&
            typeof d.totalPages === "number" &&
            d.totalPages > 0 &&
            typeof d.page === "number" &&
            d.page >= d.totalPages
          ) {
            goToPage(d.totalPages - 1);
            return;
          }
          const list = Array.isArray(d.content) ? d.content : [];
          setItems(list);
          setTotalPages(
            Number.isFinite(d.totalPages) ? d.totalPages : 0
          );
          setTotalElements(
            Number.isFinite(d.totalElements) ? d.totalElements : 0
          );
          setEmpty(d.empty === true || (list.length === 0 && d.totalElements === 0));
          setApiPage(Number.isFinite(d.page) ? d.page : page0);
        }
      } else if (res.status === 204) {
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
        setEmpty(true);
      } else {
        setError("Não foi possível carregar os produtos.");
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
        setEmpty(true);
      }
    } catch (e) {
      if (seq !== loadSeq.current) return;
      console.error(e);
      const msg = e?.response?.data?.error || e?.message || "Erro desconhecido";
      setError("Não foi possível carregar os produtos: " + msg);
      setItems([]);
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
      }
    }
  }, [page0, categoriaParam, qParam, goToPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading && !error) {
      window.scrollTo(0, 0);
    }
  }, [page0, loading, error]);

  if (loading) {
    return (
      <div className={`min-h-[50vh] ${productShowcaseFontClass}`}>
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20">
          <div className="h-6 sm:h-8 w-32 sm:w-40 animate-pulse rounded-full bg-[var(--surface-alt)] mx-auto" />
          <div className="mt-3 h-3 w-48 max-w-full mx-auto animate-pulse rounded-full bg-[var(--surface-alt)]" />
          <div className="mt-10 sm:mt-12 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
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

  const currentHuman = totalPages > 0 ? apiPage + 1 : 0;
  const canPrev = totalPages > 0 && !empty && apiPage > 0;
  const canNext = totalPages > 0 && !empty && apiPage < totalPages - 1;
  const showPager = totalPages > 1;

  return (
    <div
      className={`min-h-screen ${productShowcaseFontClass} selection:bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]`}
    >
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
          {totalElements > 0 && (
            <p className="mt-2 text-xs text-[var(--text-muted)]/90" aria-live="polite">
              {totalElements} {totalElements === 1 ? "item" : "itens"}
            </p>
          )}
        </header>

        <div className="w-full max-w-2xl mx-auto mb-8 sm:mb-10 space-y-4 px-0">
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            role="group"
            aria-label="Filtrar por categoria"
          >
            {CATEGORIA_FILTERS.map(({ value, label }) => {
              const active =
                (value === "" && !categoriaParam) || value === categoriaParam;
              return (
                <button
                  key={value || "all"}
                  type="button"
                  onClick={() => setCategoriaFilter(value)}
                  className="rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors"
                  style={
                    active
                      ? {
                          background: "var(--primary)",
                          color: "var(--on-primary, #fff)",
                        }
                      : {
                          background: "var(--surface)",
                          color: "var(--text)",
                          border: "1px solid color-mix(in srgb, var(--c-border) 80%, transparent)",
                        }
                  }
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <label className="relative block max-w-md mx-auto">
            <span className="sr-only">Buscar produtos</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]/80"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              value={qInput}
              onChange={onSearchInputChange}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Buscar por nome ou descrição…"
              className="w-full rounded-2xl border py-2.5 pl-10 pr-4 text-sm bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
              style={{ borderColor: "var(--c-border)" }}
            />
          </label>
        </div>

        {empty ? (
          <p className="text-center text-[var(--text-muted)] py-20 text-sm sm:text-base">
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <>
            <ul className="m-0 list-none p-0 grid grid-cols-2 md:grid-cols-3 gap-3 min-[480px]:gap-4 sm:gap-6 md:gap-8">
              {items.map((p) => {
                const rawName = p?.nome || "Produto";
                const nome = formatProductNameForDisplay(rawName);
                const preco = p?.preco != null ? formatProdutoBrl(p.preco) : null;
                const hrefWa = buildWaHref({
                  number: phoneBase,
                  message: PRODUTO_WA_MSG(rawName),
                });
                const catL = formatProdutoCategoriaLabel(p?.categoria);
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
                        to={
                          catalogListSearch
                            ? {
                                pathname: `/produtos/${p.id}`,
                                search: catalogListSearch,
                              }
                            : `/produtos/${p.id}`
                        }
                        className="flex min-h-0 flex-1 flex-col min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/45"
                      >
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--surface-alt)]">
                          {catL ? (
                            <span
                              className="absolute top-2 left-2 z-[1] max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[0.6rem] sm:text-[0.65rem] font-semibold tracking-wide uppercase"
                              style={{
                                color: "var(--text)",
                                background:
                                  "color-mix(in srgb, var(--surface) 88%, var(--c-border) 12%)",
                                boxShadow: "0 1px 2px color-mix(in srgb, #000 12%, transparent)",
                                border:
                                  "1px solid color-mix(in srgb, var(--c-border) 45%, transparent)",
                              }}
                            >
                              {catL}
                            </span>
                          ) : null}
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

            {showPager && (
              <nav
                className="mt-10 sm:mt-12 flex flex-col items-center justify-center gap-4"
                aria-label="Paginação do catálogo"
              >
                <div className="flex w-full max-w-md items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => goToPage(apiPage - 1)}
                    disabled={!canPrev}
                    className="inline-flex h-11 min-w-[2.75rem] flex-1 sm:flex-initial sm:min-w-0 items-center justify-center gap-1.5 rounded-2xl border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: "var(--c-border)",
                      color: "var(--text)",
                      background: "var(--surface)",
                    }}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <p className="min-w-0 flex-1 text-center text-xs sm:text-sm text-[var(--text-muted)] tabular-nums">
                    Página {currentHuman} de {totalPages}
                  </p>
                  <button
                    type="button"
                    onClick={() => goToPage(apiPage + 1)}
                    disabled={!canNext}
                    className="inline-flex h-11 min-w-[2.75rem] flex-1 sm:flex-initial sm:min-w-0 items-center justify-center gap-1.5 rounded-2xl border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: "var(--c-border)",
                      color: "var(--text)",
                      background: "var(--surface)",
                    }}
                    aria-label="Próxima página"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <p className="text-[0.7rem] text-[var(--text-muted)]/85">
                  {PAGE_SIZE} itens por página
                </p>
              </nav>
            )}
          </>
        )}

        {!empty && !phoneBase && (
          <p className="text-center text-[0.7rem] sm:text-xs text-[var(--text-muted)]/90 mt-8 max-w-sm mx-auto leading-relaxed">
            Com telefone da unidade configurado, o WhatsApp aparece no fim de cada cartão.
          </p>
        )}
      </div>
    </div>
  );
}
