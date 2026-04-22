// Detalhe do produto — layout premium, responsivo (stack mobile / 2 col desktop)
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, ImageOff } from "lucide-react";
import api from "@/lib/api.js";
import useTenant from "@/store/tenant";
import { applyEmDashDocumentTitle } from "@/lib/shellBranding";
import { buildWaHref, resolveTenantPhone, resolveGlobalFallback } from "@/lib/whats.js";
import {
  PRODUTO_WA_MSG,
  formatProdutoBrl,
  productShowcaseFontClass,
  formatProductNameForDisplay,
} from "@/lib/produtoUtils.js";

function DetalheImage({ src, nome }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        className="flex h-full min-h-[280px] sm:min-h-[360px] flex-col items-center justify-center gap-3"
        style={{
          background:
            "linear-gradient(165deg, color-mix(in srgb, var(--surface-alt) 100%, #888 0%) 0%, color-mix(in srgb, var(--surface) 85%, var(--c-border) 15%) 100%)",
        }}
        role="img"
        aria-label="Sem imagem do produto"
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "color-mix(in srgb, var(--c-border) 30%, transparent)",
            color: "var(--text-muted)",
          }}
        >
          <ImageOff className="h-6 w-6 opacity-50" strokeWidth={1.2} aria-hidden />
        </div>
        <span className="text-xs font-medium tracking-[0.14em] uppercase text-[var(--text-muted)]/75">
          Sem fotografia
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={nome || "Produto"}
      className="h-full w-full object-contain"
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const empresa = useTenant((s) => s.empresa);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const phoneBase = useMemo(
    () => (resolveTenantPhone(empresa) || resolveGlobalFallback() || "").toString(),
    [empresa]
  );

  const load = useCallback(async () => {
    if (!id) return;
    setData(null);
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/v1/produtos/${id}`, { validateStatus: () => true });
      if (res.status === 200) {
        setData(res.data);
      } else if (res.status === 404) {
        setError("notfound");
      } else {
        setError("load");
      }
    } catch (e) {
      console.error(e);
      setError("load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const preco = data?.preco != null ? formatProdutoBrl(data.preco) : null;
  const nome =
    data?.nome != null ? formatProductNameForDisplay(data.nome) : "Produto";
  const hrefWa = buildWaHref({
    number: phoneBase,
    message: PRODUTO_WA_MSG(data?.nome != null ? data.nome : "Produto"),
  });

  useEffect(() => {
    if (data?.nome) {
      applyEmDashDocumentTitle(
        formatProductNameForDisplay(data.nome),
        "Produtos",
        empresa
      );
    }
  }, [data?.nome, empresa]);

  if (loading) {
    return (
      <div className={`min-h-screen ${productShowcaseFontClass}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="h-4 w-24 rounded bg-[var(--surface-alt)] animate-pulse" />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="aspect-[4/5] rounded-[2rem] bg-[var(--surface-alt)] animate-pulse" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 rounded bg-[var(--surface-alt)] animate-pulse" />
              <div className="h-6 w-1/3 rounded bg-[var(--surface-alt)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === "notfound" || !data) {
    return (
      <div className={`min-h-[50vh] ${productShowcaseFontClass} px-4 py-20 text-center`}>
        <p className="text-[var(--text-muted)]">Produto não encontrado.</p>
        <Link
          to="/produtos"
          className="mt-6 inline-flex items-center gap-2 text-[var(--primary)] font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos produtos
        </Link>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className={`px-4 py-16 text-center ${productShowcaseFontClass}`}>
        <p className="text-red-600 dark:text-red-400">Não foi possível carregar o produto.</p>
        <button
          type="button"
          onClick={() => navigate("/produtos")}
          className="mt-4 text-[var(--primary)] underline"
        >
          Ver todos os produtos
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 sm:pb-12 ${productShowcaseFontClass}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <Link
          to="/produtos"
          className="group inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Produtos</span>
        </Link>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">
          <div
            className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_100%,transparent)] bg-[var(--surface-alt)] aspect-[4/5] sm:aspect-[1/1] max-h-[min(85vh,720px)] lg:max-h-[min(88vh,800px)] lg:sticky lg:top-6"
          >
            <DetalheImage src={data.imagem} nome={nome} />
          </div>

          <div className="flex flex-col pt-0 lg:pt-4 pb-2">
            {data.sku ? (
              <p
                className="text-xs sm:text-sm tracking-[0.12em] uppercase text-[var(--text-muted)] font-medium"
              >
                Ref. {data.sku}
              </p>
            ) : null}
            <h1
              className="mt-1 text-[1.75rem] sm:text-[2.1rem] md:text-[2.35rem] font-semibold tracking-[-0.035em] leading-[1.12] text-[var(--text)] normal-case [overflow-wrap:anywhere] hyphens-auto"
            >
              {nome}
            </h1>
            {preco ? (
              <p className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-medium tabular-nums tracking-tight text-[var(--text)]">
                {preco}
              </p>
            ) : (
              <p className="mt-4 text-lg text-[var(--text-muted)]">Consulte valores com nossa equipe.</p>
            )}

            {data.descricao ? (
              <div className="mt-8 sm:mt-10 space-y-3 text-[var(--text)]/90 text-base sm:text-[1.05rem] leading-[1.55] max-w-prose">
                {data.descricao.split(/\n+/).map((block, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {block}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {hrefWa ? (
                <a
                  href={hrefWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full py-3.5 px-8 text-base font-medium text-white bg-[#25D366] shadow-[0_4px_24px_-4px_rgba(37,211,102,0.5)] hover:shadow-[0_6px_28px_-4px_rgba(37,211,102,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  WhatsApp
                </a>
              ) : (
                <p className="text-sm text-[var(--text-muted)] self-center">Telefone de contato não configurado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
