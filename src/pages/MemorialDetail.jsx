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
  BookHeart,
  Image as ImageIcon,
  Info,
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
  if (!c) return { h: 158, s: 72, l: 45 };
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

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

function SectionCard({ children, highContrast, className = "" }) {
  const ring = highContrast
    ? "ring-black/30 dark:ring-white/30"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-3xl p-4 sm:p-6 ring-1 bg-[var(--surface)]",
        "shadow-[0_18px_55px_rgba(0,0,0,.06)]",
        ring,
        className
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 bg-[color:color-mix(in_srgb,var(--surface-alt)_82%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]">
              <Icon className="h-[18px] w-[18px] opacity-85 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
            </span>
          ) : null}
          <h2 className="text-[15px] sm:text-lg font-semibold text-[var(--text)] leading-tight">
            {title}
          </h2>
        </div>
        {subtitle ? (
          <p className="mt-2 text-sm text-[var(--text)] opacity-75 leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MiniNav({ items = [] }) {
  return (
    <div
      className={clsx(
        "mt-3 sm:mt-4 rounded-2xl p-2 ring-1",
        "bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur",
        "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]",
        "shadow-[0_14px_42px_rgba(0,0,0,.06)]"
      )}
    >
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={it.onClick}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1",
              "bg-[color:color-mix(in_srgb,var(--surface-alt)_86%,transparent)]",
              "ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]",
              "text-[var(--text)] hover:opacity-95"
            )}
          >
            <it.icon className="h-4 w-4 opacity-80" />
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== Timeline ===== */
function TimelineItem({ title, date, hour, place, icon: Icon, highContrast }) {
  const hasAnything = Boolean(date || hour || place);
  if (!hasAnything) return null;

  const pillRing = highContrast
    ? "ring-black/25 dark:ring-white/25"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]";

  return (
    <div className="relative pl-9">
      <div
        className="absolute left-3 top-2 bottom-2 w-px"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--brand) 22%, transparent), color-mix(in srgb, var(--c-border) 55%, transparent))",
        }}
        aria-hidden="true"
      />

      <div
        className={clsx(
          "absolute left-0 top-1.5 h-6 w-6 rounded-2xl ring-1 flex items-center justify-center",
          "bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)]",
          pillRing
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
      </div>

      <div
        className={clsx(
          "rounded-2xl p-4 ring-1 bg-[color:color-mix(in_srgb,var(--surface-alt)_78%,transparent)]",
          pillRing
        )}
      >
        <div className="text-sm font-semibold text-[var(--text)]">{title}</div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--text)] opacity-90">
          {date ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 opacity-75" />
              <span className="tabular-nums">{date}</span>
            </span>
          ) : null}

          {hour ? (
            <span className="inline-flex items-center gap-1">
              <span className="opacity-60">•</span>
              <Clock3 className="h-4 w-4 opacity-75" />
              <span className="tabular-nums">{hour}</span>
            </span>
          ) : null}
        </div>

        {place ? (
          <button
            type="button"
            onClick={() => openMaps(place)}
            className="mt-2 inline-flex items-start gap-2 text-[color:var(--brand-700)] hover:underline dark:text-[color:var(--brand-50)]"
            title="Abrir no Google Maps"
          >
            <MapPin className="h-4 w-4 mt-0.5" />
            <span className="text-left break-words">{place}</span>
            <ExternalLink className="h-3.5 w-3.5 mt-0.5 opacity-90" />
          </button>
        ) : null}
      </div>
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

  const bioRef = useRef(null);
  const agendaRef = useRef(null);
  const tributeRef = useRef(null);
  const messagesRef = useRef(null);
  const galleryRef = useRef(null);

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

  function scrollTo(ref) {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleCreateInteracao(obitoId, payload) {
    await createMemorialInteracao(obitoId, payload);
    const latest = await getMemorialInteracoes(obitoId);
    setInteracoes(Array.isArray(latest) ? latest : []);
    setTimeout(() => scrollTo(messagesRef), 250);
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

  const foto = data?.fotoUrl || data?.foto || null;
  const capa = data?.fotoCapaUrl || null;
  const heroImage = capa || foto || null;

  const nasc = fmtDate(data?.dtNascimento);
  const fale = fmtDate(data?.dtFalecimento);
  const horaFal = fmtHour(data?.horaFalecimento);
  const idade = calcAge(data?.dtNascimento, data?.dtFalecimento);

  // ✅ métricas: presentes, mas o peso visual fica no IdentityCard (mais discreto)
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

  const navItems = [
    { key: "bio", label: "Biografia", icon: Info, onClick: () => scrollTo(bioRef) },
    { key: "agenda", label: "Agenda", icon: Calendar, onClick: () => scrollTo(agendaRef) },
    { key: "homenagens", label: "Homenagens", icon: Heart, onClick: () => scrollTo(tributeRef) },
    { key: "galeria", label: "Fotos", icon: ImageIcon, onClick: () => scrollTo(galleryRef) },
    { key: "mensagens", label: "Mensagens", icon: BookHeart, onClick: () => scrollTo(messagesRef) },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <BackButton to="/memorial" />

        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={copyLink} title="Copiar link" className="btn-brand-ghost">
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

      {/* Identity Card — editorial */}
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
        />

        {/* Mini navegação (excelente para idosos: previsibilidade) */}
        <MiniNav items={navItems} />
      </div>

      {/* GRID PRINCIPAL */}
      <div className="mt-5 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Sidebar (desktop): reforço de “despedida” + CTA único */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            <div ref={agendaRef} />

            <SectionCard highContrast={highContrast}>
              <SectionHeader
                icon={Calendar}
                title="Agenda de despedida"
                subtitle="Informações de velório, cerimônia e sepultamento."
              />

              <div className="mt-4 space-y-3">
                <TimelineItem
                  title="Velório"
                  date={velorioData}
                  hour={velorioHora}
                  place={localVelorio}
                  icon={Clock3}
                  highContrast={highContrast}
                />
                <TimelineItem
                  title="Cerimônia"
                  date={cerimoniaData}
                  hour={cerimoniaHora}
                  place={localCerimonia}
                  icon={Calendar}
                  highContrast={highContrast}
                />
                <TimelineItem
                  title="Sepultamento"
                  date={sepData}
                  hour={sepHora}
                  place={localSepultamento}
                  icon={MapPin}
                  highContrast={highContrast}
                />

                {data?.qrcodeUrl ? (
                  <div className="mt-2 rounded-2xl p-4 ring-1 bg-[color:color-mix(in_srgb,var(--surface-alt)_82%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      <QrCode className="h-4 w-4 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
                      QR do Memorial
                    </div>
                    <img
                      src={data.qrcodeUrl}
                      alt="QR do memorial"
                      className="mt-3 h-36 w-36 sm:h-40 sm:w-40 object-contain"
                    />
                  </div>
                ) : null}
              </div>
            </SectionCard>

            {/* CTA ÚNICO (sem duplicar com outro bloco no main) */}
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
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-[color:var(--brand-700)] dark:text-[color:var(--brand-50)]" />
                    <div className="text-sm font-semibold text-[var(--text)]">
                      Deixar homenagem
                    </div>
                    <span className="ml-1 cta-badge">{interacoes.length}</span>
                  </div>

                  <p className="mt-1 text-xs text-[var(--text)] opacity-80 leading-relaxed">
                    Mensagem, livro de presença, vela ou flor. Um gesto simples e respeitoso.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => scrollTo(tributeRef)}
                  className="btn-brand shrink-0"
                >
                  Homenagear
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Conteúdo principal — fluxo emocional */}
        <main className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Biografia primeiro (quem foi) */}
          <div ref={bioRef} />
          <SectionCard highContrast={highContrast}>
            <SectionHeader
              icon={Info}
              title="Biografia"
              subtitle="Uma lembrança breve e respeitosa sobre a história e a vida."
            />

            {biografia ? (
              <div className="prose prose-zinc max-w-none mt-3 dark:prose-invert">
                <p>{biografia}</p>
              </div>
            ) : (
              <p className="mt-3 text-[var(--text)] opacity-85 leading-relaxed">
                A família ainda não adicionou uma biografia. Assim que for disponibilizada, aparecerá aqui.
              </p>
            )}

            {epitafio ? (
              <blockquote
                className="mt-4 rounded-2xl px-4 py-3 italic ring-1"
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
            ) : null}
          </SectionCard>

          {/* Homenagem (ação consciente) */}
          <div ref={tributeRef} />
          <TributeForm
            obitoId={data.id}
            nomeFalecido={nome}
            highContrast={highContrast}
            onSubmit={handleCreateInteracao}
            termosHref="/termos-de-servico.html"
            privacidadeHref="/politica-de-privacidade.html"
          />

          {/* Galeria (memória visual) */}
          <div ref={galleryRef} />
          <GalleryGrid items={midias} highContrast={highContrast} />

          {/* Mensagens (voz coletiva) */}
          <div ref={messagesRef} />
          <MessagesList items={interacoes} highContrast={highContrast} />

          {loadingExtras ? (
            <div className="text-sm text-[var(--text)] opacity-70 px-1">
              Carregando galeria e homenagens…
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
