// src/pages/MemorialDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

import {
  getMemorialById,
  getMemorialMidias,
  getMemorialInteracoes,
  createMemorialInteracao,
} from "@/lib/nalapide";

import BackButton from "@/components/BackButton";

import HeroPhotography from "@/components/memorial/HeroPhotography";
import IdentityCard from "@/components/memorial/IdentityCard";

import GalleryGrid from "@/components/memorial/GalleryGrid";
import TributeForm from "@/components/memorial/TributeForm";
import MessagesList from "@/components/memorial/MessagesList";

import {
  Calendar,
  MapPin,
  Clock3,
  Share2,
  QrCode,
  Copy,
  ExternalLink,
  MessageCircle,
  Facebook,
  Heart,
} from "lucide-react";

/* ===== Alto contraste (persistido em localStorage) ===== */
const HC_KEY = "prefersHighContrast";
function useHighContrast() {
  const [highContrast, setHighContrast] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(HC_KEY) === "1";
    setHighContrast(saved);
    document.documentElement.classList.toggle("hc", saved);
  }, []);
  return { highContrast };
}

/* ===== Helpers de cor ===== */
function hexToHsl(hex) {
  let c = String(hex || "").replace("#", "");
  if (!c) return { h: 158, s: 72, l: 45 }; // fallback emerald
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  const r = (num >> 16) / 255,
    g = ((num >> 8) & 255) / 255,
    b = (num & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}
function setBrandVars(hex) {
  const root = document.documentElement;
  const { h, s, l } = hexToHsl(hex);
  const l600 = clamp(l - 8, 0, 100);
  const l700 = clamp(l - 14, 0, 100);
  const l50 = clamp(l + 40, 0, 100);
  const l100 = clamp(l + 28, 0, 100);
  root.style.setProperty("--brand", `hsl(${h} ${s}% ${l}%)`);
  root.style.setProperty("--brand-600", `hsl(${h} ${s}% ${l600}%)`);
  root.style.setProperty("--brand-700", `hsl(${h} ${s}% ${l700}%)`);
  root.style.setProperty("--brand-50", `hsl(${h} ${s}% ${l50}%)`);
  root.style.setProperty("--brand-100", `hsl(${h} ${s}% ${l100}%)`);
  root.style.setProperty("--on-brand", `#ffffff`);
}

/* ====================== Datas ====================== */
function safeDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  const fixed = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  return isNaN(fixed) ? null : fixed;
}
function fmtDate(d) {
  const s = safeDate(d);
  return s ? s.toLocaleDateString("pt-BR") : "—";
}
function fmtHour(hhmmss) {
  if (!hhmmss) return null;
  const [h, m] = String(hhmmss).split(":");
  if (!h || !m) return null;
  return `${h?.padStart(2, "0")}:${m?.padStart(2, "0")}`;
}
function calcAge(dtNasc, dtFim) {
  const n = safeDate(dtNasc);
  const f = safeDate(dtFim) || new Date();
  if (!n) return null;
  let age = f.getFullYear() - n.getFullYear();
  const m = f.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && f.getDate() < n.getDate())) age--;
  return age;
}

/* ================= UI ================= */
function openMaps(q) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    q
  )}`;
  window.open(url, "_blank");
}

function AgendaCard({ title, data, hora, local, icon: Icon, hc }) {
  const wrap = hc
    ? "bg-[var(--surface)] text-[var(--text)] ring-1 ring-black/30 dark:bg-black dark:text-[var(--text)] dark:ring-white/30"
    : "bg-[var(--surface)] text-[var(--text)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:bg-[var(--surface)] dark:text-[var(--text)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  return (
    <div
      className={`min-h-[112px] rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,.05)] ${wrap}`}
    >
      <div className="flex items-center gap-2 text-sm sm:text-[15px] font-semibold">
        <Icon className="h-4.5 w-4.5 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
        {title}
      </div>

      {(data || hora) && (
        <p className="mt-2 text-sm flex flex-wrap items-center gap-2 text-[var(--text)]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4 opacity-80" />
            <span className="tabular-nums">{data || "Data a definir"}</span>
          </span>
          {hora && (
            <span className="inline-flex items-center gap-1">
              <span className="opacity-60">•</span>
              <Clock3 className="h-4 w-4 opacity-80" />
              <span className="tabular-nums">{hora}</span>
            </span>
          )}
        </p>
      )}

      {local && (
        <button
          type="button"
          onClick={() => openMaps(local)}
          className="mt-2 inline-flex items-start gap-2 text-[color:var(--brand-700)] hover:underline dark:text-[color:var(--brand-50)]"
          title="Abrir no Google Maps"
        >
          <MapPin className="h-4 w-4 mt-0.5" />
          <span className="text-left break-words">{local}</span>
          <ExternalLink className="h-3.5 w-3.5 mt-0.5 opacity-90" />
        </button>
      )}
    </div>
  );
}

/* ====================== Página ====================== */
export default function MemorialDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const { highContrast } = useHighContrast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // extras
  const [midias, setMidias] = useState([]);
  const [interacoes, setInteracoes] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  const tributeRef = useRef(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);
        const d = await getMemorialById(slug);
        setData(d);
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar este memorial.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // aplica a cor da empresa
  useEffect(() => {
    const cor =
      data?.empresa?.corPrimaria || data?.empresa?.brandColor || "#10B981";
    if (cor) setBrandVars(cor);
  }, [data?.empresa?.corPrimaria, data?.empresa?.brandColor]);

  // carrega galeria + mensagens
  useEffect(() => {
    if (!data?.id) return;

    (async () => {
      try {
        setLoadingExtras(true);
        const [m, i] = await Promise.all([
          getMemorialMidias(data.id),
          getMemorialInteracoes(data.id),
        ]);
        setMidias(Array.isArray(m) ? m : []);
        setInteracoes(Array.isArray(i) ? i : []);
      } catch (e) {
        console.error("[MemorialDetail] erro extras:", e);
        setMidias([]);
        setInteracoes([]);
      } finally {
        setLoadingExtras(false);
      }
    })();
  }, [data?.id]);

  const urlAtual = useMemo(
    () => (window?.location?.origin || "") + location.pathname,
    [location.pathname]
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(urlAtual);
    } catch {}
  }

  function scrollToTribute() {
    tributeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function scrollToMessages() {
    messagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleCreateInteracao(obitoId, payload) {
    await createMemorialInteracao(obitoId, payload);
    const latest = await getMemorialInteracoes(obitoId);
    setInteracoes(Array.isArray(latest) ? latest : []);
    // levar o usuário para as mensagens após enviar (sensação de “registro efetuado”)
    setTimeout(() => scrollToMessages(), 250);
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <BackButton to="/memorial" />
        <div className="mt-4 sm:mt-6">
          <div className="animate-pulse">
            <div className="h-56 sm:h-64 w-full rounded-3xl bg-[var(--surface)] ring-1 ring-[var(--c-border)]" />
            <div className="mt-4 h-28 w-full rounded-3xl bg-[var(--surface)] ring-1 ring-[var(--c-border)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12 text-[var(--primary)]">
        {error}
      </div>
    );
  }

  if (!data) return null;

  /* Dados principais */
  const nome = data?.nomeFalecido || data?.nome || "Sem nome";

  // capa inexistente acontece muito → fallback para foto
  const foto = data?.fotoUrl || data?.foto || null;
  const capa = data?.fotoCapaUrl || null;
  const heroImage = capa || foto || null;

  const nasc = fmtDate(data?.dtNascimento);
  const fale = fmtDate(data?.dtFalecimento);
  const horaFal = fmtHour(data?.horaFalecimento);
  const idade = calcAge(data?.dtNascimento, data?.dtFalecimento);

  const views = Number(data?.contadorAcessos ?? 0);
  const reacoes = Number(data?.numeroReacoes ?? 0);

  const velorioData = fmtDate(data?.dtVelorio);
  const velorioHora = fmtHour(data?.horaVelorio);
  const localVelorio = data?.localVelorio;

  const cerimoniaData = fmtDate(data?.dtCerimonia);
  const cerimoniaHora = fmtHour(data?.horaCerimonia);
  const localCerimonia = data?.localCerimonia;

  const sepData = fmtDate(data?.dtSepultamento);
  const sepHora = fmtHour(data?.horaSepultamento);
  const localSepultamento = data?.localSepultamento;

  const localFalecimento = data?.localFalecimento;
  const naturalidade = data?.naturalidade;
  const epitafio = data?.epitafio;
  const biografia = data?.biografia;

  const shareWhats = `https://wa.me/?text=${encodeURIComponent(
    `Em memória de ${nome} (${nasc} — ${fale})\n\nAcesse o memorial: ${urlAtual}`
  )}`;
  const shareFb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    urlAtual
  )}`;

  const cardWrap = highContrast
    ? "bg-[var(--surface)] ring-1 ring-black/30 dark:bg-black dark:ring-white/30"
    : "bg-[var(--surface)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:bg-[var(--surface)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <BackButton to="/memorial" />
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={copyLink}
            title="Copiar link"
            className="btn-brand-ghost"
          >
            <Copy className="h-5 w-5" />
          </button>

          <a
            href={shareWhats}
            target="_blank"
            rel="noreferrer"
            title="WhatsApp"
            className="btn-brand-ghost"
          >
            <MessageCircle className="h-5 w-5" />
          </a>

          <a
            href={shareFb}
            target="_blank"
            rel="noreferrer"
            title="Facebook"
            className="btn-brand-ghost"
          >
            <Facebook className="h-5 w-5" />
          </a>

          <button
            type="button"
            className="btn-brand hidden sm:inline-flex items-center gap-2 ml-1"
            title="Compartilhar"
            onClick={copyLink}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">Compartilhar</span>
          </button>
        </div>
      </div>

      {/* HERO — fotografia (sem texto) */}
      <div className="mt-4 sm:mt-6">
        <HeroPhotography
          image={heroImage}
          alt={nome}
          brandHex={data?.empresa?.corPrimaria || data?.empresa?.brandColor || null}
          highContrast={highContrast}
        />
      </div>

      {/* Identity Card — nome legível + métricas (fora da imagem) */}
      <div className="-mt-8 sm:-mt-10 relative z-10 px-1">
        <IdentityCard
          nome={nome}
          fotoUrl={foto}
          nasc={nasc}
          fale={fale}
          horaFal={horaFal}
          idade={idade}
          views={views}
          reacoes={reacoes}
          naturalidade={naturalidade}
          localFalecimento={localFalecimento}
          highContrast={highContrast}
          // se seu IdentityCard aceitar callback/extra: pode adicionar CTA pra rolar até homenagens
          // onOpenTribute={scrollToTribute}
          // messagesCount={interacoes.length}
          // onOpenMessages={scrollToMessages}
        />
      </div>

      {/* GRID PRINCIPAL */}
      <div className="mt-5 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            <div
              className={`${cardWrap} rounded-3xl p-4 sm:p-6 shadow-[0_18px_55px_rgba(0,0,0,.06)]`}
            >
              <h2 className="text-[15px] sm:text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
                Agenda & Locais
              </h2>

              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                <AgendaCard
                  title="Velório"
                  data={velorioData}
                  hora={velorioHora}
                  local={localVelorio}
                  icon={Clock3}
                  hc={highContrast}
                />
                <AgendaCard
                  title="Cerimônia"
                  data={cerimoniaData}
                  hora={cerimoniaHora}
                  local={localCerimonia}
                  icon={Calendar}
                  hc={highContrast}
                />
                <AgendaCard
                  title="Sepultamento"
                  data={sepData}
                  hora={sepHora}
                  local={localSepultamento}
                  icon={MapPin}
                  hc={highContrast}
                />

                {data?.qrcodeUrl && (
                  <div className={`${cardWrap} rounded-2xl p-4`}>
                    <p className="text-sm font-medium flex items-center gap-2 text-[var(--text)]">
                      <QrCode className="h-4 w-4 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
                      QR do Memorial
                    </p>
                    <img
                      src={data.qrcodeUrl}
                      alt="QR do memorial"
                      className="mt-3 h-36 w-36 sm:h-40 sm:w-40 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Ação rápida (mobile-friendly) */}
            <div
              className="rounded-3xl p-4 ring-1 shadow-[0_18px_55px_rgba(0,0,0,.06)]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--brand-100) 75%, var(--c-border))",
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--brand-50) 92%, white) 0%, var(--surface) 70%, var(--surface) 100%)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
                    <div className="text-sm font-semibold text-[var(--text)]">
                      Homenagens
                    </div>
                    <span className="ml-1 cta-badge">{interacoes.length}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text)] opacity-80">
                    Envie uma mensagem, assine o livro, acenda uma vela ou envie uma flor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={scrollToTribute}
                  className="btn-brand"
                >
                  Homenagear
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Biografia */}
          <section
            className={`${cardWrap} rounded-3xl p-4 sm:p-6 shadow-[0_18px_55px_rgba(0,0,0,.06)]`}
          >
            <h2 className="text-[15px] sm:text-lg font-semibold text-[var(--text)]">
              Biografia
            </h2>

            {biografia ? (
              <div className="prose prose-zinc max-w-none mt-2 sm:mt-3 dark:prose-invert">
                <p>{biografia}</p>
              </div>
            ) : (
              <p className="mt-2 sm:mt-3 text-[var(--text)]">
                A família ainda não adicionou uma biografia. Assim que for disponibilizada, aparecerá aqui.
              </p>
            )}

            {epitafio && (
              <blockquote
                className="mt-3 sm:mt-4 rounded-2xl px-4 py-3 italic ring-1"
                style={{
                  background:
                    "color-mix(in srgb, var(--surface-alt) 70%, transparent)",
                  borderColor:
                    "color-mix(in srgb, var(--c-border) 80%, transparent)",
                  color: "var(--text)",
                }}
              >
                “{epitafio}”
              </blockquote>
            )}
          </section>

          {/* CTA homenagens */}
          <section
            className="rounded-3xl p-4 sm:p-6 ring-1 shadow-[0_18px_55px_rgba(0,0,0,.06)]"
            style={{
              borderColor:
                "color-mix(in srgb, var(--brand-100) 75%, var(--c-border))",
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--brand-50) 92%, white) 0%, var(--surface) 55%, var(--surface) 100%)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-6 items-center">
              <div className="sm:col-span-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
                  <h3
                    className="text-[15px] sm:text-base font-semibold"
                    style={{
                      color: "color-mix(in srgb, var(--brand-700) 92%, black)",
                    }}
                  >
                    Homenagens & Reações
                  </h3>
                  <span className="ml-1 cta-badge">{interacoes.length}</span>
                </div>

                <p
                  className="text-sm mt-1"
                  style={{
                    color:
                      "color-mix(in srgb, var(--text) 75%, var(--brand-700))",
                  }}
                >
                  Deixe uma mensagem, assine o livro de presença, acenda uma vela 🕯️ ou envie flores 🌹 para homenagear {nome}.
                </p>
              </div>

              <div className="sm:col-span-2 flex items-center sm:justify-end gap-2">
                <div className="hidden sm:block cta-divider" aria-hidden="true" />
                <button
                  type="button"
                  className="btn-brand w-full sm:w-auto"
                  onClick={scrollToTribute}
                >
                  Enviar homenagem
                </button>
              </div>
            </div>
          </section>

          {/* FORM HOMENAGEM */}
          <div ref={tributeRef} />

<TributeForm
  obitoId={data.id}
  nomeFalecido={nome}
  highContrast={highContrast}
  onSubmit={handleCreateInteracao}
  termosHref="/termos-de-servico.html"
  privacidadeHref="/politica-de-privacidade.html"
/>


          {/* GALERIA */}
          <GalleryGrid items={midias} highContrast={highContrast} />

          {/* MENSAGENS */}
          <div ref={messagesRef} />
          <MessagesList items={interacoes} highContrast={highContrast} />

          {/* Loader discreto para extras */}
          {loadingExtras && (
            <div className="text-sm text-[var(--text)] opacity-70 px-1">
              Carregando galeria e homenagens…
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
