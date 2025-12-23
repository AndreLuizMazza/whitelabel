// src/components/TributeForm.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import CTAButton from "@/components/ui/CTAButton";
import ConfirmTermsModal from "@/components/ui/ConfirmTermsModal";
import {
  MessageSquareText,
  BookHeart,
  Flame,
  Flower2,
  User,
  AtSign,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronDown,
  Check,
} from "lucide-react";

/**
 * ✅ Contrato oficial (payload.tipo):
 * "MENSAGEM" | "VELA" | "LIVRO" | "FLOR"
 */
export const UI_INTERACTION_TYPES = [
  { key: "MENSAGEM", label: "Mensagem", needsText: true, icon: MessageSquareText },
  { key: "VELA", label: "Vela", needsText: false, icon: Flame },
  { key: "FLOR", label: "Flor", needsText: false, icon: Flower2 },
  { key: "LIVRO", label: "Livro", needsText: false, icon: BookHeart },
];

function normalizeContato(v) {
  return String(v || "").trim();
}
function isEmail(v) {
  const s = String(v || "").trim();
  return /.+@.+\..+/.test(s);
}
function normalizePhone(v) {
  return String(v || "").replace(/\D/g, "");
}
function short(s, n = 140) {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? str.slice(0, n) + "…" : str;
}

/**
 * ✅ Hard-guard: garante que o tipo SEMPRE seja um dos 4 oficiais.
 * Aceita também legados comuns.
 */
function normalizeTipo(v) {
  const raw = String(v || "").trim();
  if (!raw) return "MENSAGEM";

  const up = raw.toUpperCase();
  const allowed = new Set(UI_INTERACTION_TYPES.map((x) => x.key));
  if (allowed.has(up)) return up;

  const low = raw.toLowerCase().replace(/\s+/g, "_");
  const legacy = {
    mensagem_condolencia: "MENSAGEM",
    vela_digital: "VELA",
    livro_digital: "LIVRO",
    flor_digital: "FLOR",

    acender_vela: "VELA",
    livro_visitas: "LIVRO",
    enviar_flor: "FLOR",

    mensagem: "MENSAGEM",
    vela: "VELA",
    livro: "LIVRO",
    flor: "FLOR",
  };

  return legacy[low] || "MENSAGEM";
}

/* =========================
   UI helpers (Apple-level)
========================= */

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

function HairlineCard({ children, className = "" }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl ring-1",
        "bg-[var(--surface)]",
        "ring-[color:color-mix(in_srgb,var(--c-border)_75%,transparent)]",
        "shadow-[0_22px_70px_rgba(0,0,0,.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function SubtleBg() {
  const heroBg =
    "radial-gradient(900px 340px at 12% 0%, color-mix(in srgb, var(--brand) 16%, transparent), transparent 58%)," +
    "radial-gradient(700px 280px at 92% 12%, color-mix(in srgb, var(--highlight) 12%, transparent), transparent 60%)," +
    "linear-gradient(to bottom, color-mix(in srgb, var(--surface) 92%, transparent), transparent 40%)";
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: heroBg }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--brand) 48%, transparent), transparent 60%)",
        }}
      />
    </>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-semibold text-[var(--text)]">{label}</label>
        {hint ? (
          <span className="text-xs text-[var(--text)] opacity-70">{hint}</span>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InputShell({ icon: Icon, right, children }) {
  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-2xl ring-1",
        "bg-[var(--surface-alt)]",
        "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
        "focus-within:ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))]",
        "shadow-[0_10px_30px_rgba(0,0,0,.05)]"
      )}
    >
      {Icon ? (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-70">
          <Icon className="h-[18px] w-[18px] text-[var(--text)]" />
        </div>
      ) : null}

      <div className={clsx(Icon ? "pl-10" : "", right ? "pr-10" : "")}>
        {children}
      </div>

      {right ? (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "radial-gradient(800px 200px at 20% 0%, color-mix(in srgb, var(--brand) 14%, transparent), transparent 60%)",
        }}
      />
    </div>
  );
}

/**
 * Seletor “limpo” (menos poluído):
 * - mostra só “Mensagem” em destaque (primário)
 * - as outras 3 reações vão para um “Mais” (sheet) em mobile
 * - em desktop, aparece como segmentado compacto (4 opções) — ainda limpo
 */
function ReactionPicker({
  value,
  onChange,
  compact = false,
}) {
  const safeValue = normalizeTipo(value);
  const current = UI_INTERACTION_TYPES.find((t) => t.key === safeValue) || UI_INTERACTION_TYPES[0];

  const [sheetOpen, setSheetOpen] = useState(false);

  const primary = UI_INTERACTION_TYPES[0]; // Mensagem
  const secondary = UI_INTERACTION_TYPES.filter((t) => t.key !== primary.key);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[var(--text)]">Tipo de homenagem</div>
        <div className="text-xs text-[var(--text)] opacity-70">
          Escolha um gesto simples e respeitoso
        </div>
      </div>

      {/* Desktop: segmentado iOS (limpo) */}
      <div className="hidden sm:block mt-2">
        <div
          className={clsx(
            "relative grid grid-cols-4 rounded-2xl p-1 ring-1",
            "bg-[color:color-mix(in_srgb,var(--surface-alt)_82%,transparent)]",
            "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
            "shadow-[0_10px_26px_rgba(0,0,0,.05)]"
          )}
          role="tablist"
          aria-label="Tipo de homenagem"
        >
          {UI_INTERACTION_TYPES.map((t) => {
            const Icon = t.icon;
            const active = safeValue === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange?.(t.key)}
                className={clsx(
                  "relative rounded-xl px-2 py-2.5 text-sm font-semibold transition",
                  "flex items-center justify-center gap-2",
                  active
                    ? "bg-[var(--surface)] shadow-[0_10px_22px_rgba(0,0,0,.10)] ring-1 ring-[color:color-mix(in_srgb,var(--brand)_40%,transparent)]"
                    : "opacity-80 hover:opacity-100"
                )}
                role="tab"
                aria-selected={active}
              >
                <Icon className="h-4 w-4 opacity-90" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 text-xs text-[var(--text)] opacity-70">
          {current.needsText
            ? "Mensagem com texto ficará visível no memorial."
            : "Registro simples no memorial (sem texto)."}
        </div>
      </div>

      {/* Mobile: 2 botões (Mensagem + Mais) — bem limpo */}
      <div className="sm:hidden mt-2 grid grid-cols-2 gap-2">
        {/* Mensagem */}
        <button
          type="button"
          onClick={() => onChange?.(primary.key)}
          className={clsx(
            "relative rounded-2xl px-3 py-3.5 ring-1 text-left transition",
            "bg-[color:color-mix(in_srgb,var(--surface-alt)_86%,transparent)]",
            safeValue === primary.key
              ? "ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))] shadow-[0_12px_34px_rgba(0,0,0,.10)]"
              : "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-alt)_65%,var(--brand-50))]"
          )}
          aria-pressed={safeValue === primary.key}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={clsx(
                  "inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1",
                  "bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)]",
                  safeValue === primary.key
                    ? "ring-[color:color-mix(in_srgb,var(--brand)_45%,transparent)]"
                    : "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]"
                )}
              >
                <MessageSquareText className="h-[18px] w-[18px] opacity-90" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text)] truncate">Mensagem</div>
                <div className="text-xs mt-0.5 opacity-70 text-[var(--text)]">Com texto</div>
              </div>
            </div>

            {safeValue === primary.key ? (
              <span className="text-[10px] font-semibold rounded-full px-2 py-1 ring-1 bg-[color:color-mix(in_srgb,var(--brand)_14%,transparent)] ring-[color:color-mix(in_srgb,var(--brand)_35%,transparent)]">
                Selecionado
              </span>
            ) : null}
          </div>
        </button>

        {/* Mais */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={clsx(
            "relative rounded-2xl px-3 py-3.5 ring-1 text-left transition",
            "bg-[color:color-mix(in_srgb,var(--surface-alt)_86%,transparent)]",
            safeValue !== primary.key
              ? "ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))] shadow-[0_12px_34px_rgba(0,0,0,.10)]"
              : "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-alt)_65%,var(--brand-50))]"
          )}
          aria-pressed={safeValue !== primary.key}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={clsx(
                  "inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1",
                  "bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)]",
                  safeValue !== primary.key
                    ? "ring-[color:color-mix(in_srgb,var(--brand)_45%,transparent)]"
                    : "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]"
                )}
              >
                {safeValue !== primary.key ? (
                  (() => {
                    const Icon = current.icon;
                    return <Icon className="h-[18px] w-[18px] opacity-90" />;
                  })()
                ) : (
                  <ChevronDown className="h-[18px] w-[18px] opacity-90" />
                )}
              </span>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text)] truncate">
                  {safeValue !== primary.key ? current.label : "Outras"}
                </div>
                <div className="text-xs mt-0.5 opacity-70 text-[var(--text)]">
                  {safeValue !== primary.key ? "Registro no memorial" : "Vela • Flor • Livro"}
                </div>
              </div>
            </div>

            {safeValue !== primary.key ? (
              <span className="text-[10px] font-semibold rounded-full px-2 py-1 ring-1 bg-[color:color-mix(in_srgb,var(--brand)_14%,transparent)] ring-[color:color-mix(in_srgb,var(--brand)_35%,transparent)]">
                Selecionado
              </span>
            ) : null}
          </div>
        </button>
      </div>

      {/* Sheet iOS-like */}
      {sheetOpen ? (
        <div className="sm:hidden">
          <div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className={clsx(
              "fixed left-0 right-0 bottom-0 z-[81]",
              "rounded-t-3xl p-4",
              "bg-[var(--surface)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_75%,transparent)]",
              "shadow-[0_-22px_60px_rgba(0,0,0,.25)]"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Escolher tipo de homenagem"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--text)_18%,transparent)]" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-[var(--text)]">Outras homenagens</div>
                <div className="text-sm text-[var(--text)] opacity-75 mt-0.5">
                  Registros simples, sem texto
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-alt)_85%,transparent)]"
              >
                Fechar
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {secondary.map((t) => {
                const Icon = t.icon;
                const active = safeValue === t.key;

                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      onChange?.(t.key);
                      setSheetOpen(false);
                    }}
                    className={clsx(
                      "rounded-2xl px-3 py-3 ring-1 transition text-left",
                      "bg-[color:color-mix(in_srgb,var(--surface-alt)_86%,transparent)]",
                      active
                        ? "ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))] shadow-[0_12px_34px_rgba(0,0,0,.10)]"
                        : "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]">
                          <Icon className="h-[18px] w-[18px] opacity-90" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--text)]">{t.label}</div>
                          <div className="text-xs text-[var(--text)] opacity-70 mt-0.5">
                            Registro no memorial
                          </div>
                        </div>
                      </div>

                      {active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text)] opacity-85">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-[var(--text)] opacity-65 leading-relaxed">
              Dica: se quiser escrever algo, volte e selecione <span className="font-semibold">Mensagem</span>.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TributeForm({
  obitoId,
  nomeFalecido,
  onSubmit,
  highContrast = false,
  termosHref = "/termos-de-servico.html",
  privacidadeHref = "/politica-de-privacidade.html",
}) {
  const [tipo, setTipo] = useState("MENSAGEM");
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);

  // UX: CTA “fácil” — se for reação sem texto, já deixa claro
  const safeTipo = useMemo(() => normalizeTipo(tipo), [tipo]);
  const selected = useMemo(
    () => UI_INTERACTION_TYPES.find((t) => t.key === safeTipo),
    [safeTipo]
  );

  const nomeOk = String(nome).trim();
  const contatoOk = normalizeContato(contato);
  const msgOk = String(mensagem).trim();

  const email = isEmail(contatoOk) ? contatoOk : "";
  const telefone = !email ? normalizePhone(contatoOk) : "";

  // validação minimalista (sem “gritar”)
  const canSend =
    !sending &&
    Boolean(nomeOk) &&
    Boolean(contatoOk) &&
    (!selected?.needsText || Boolean(msgOk)) &&
    (Boolean(email) || telefone.length >= 10);

  function validateBeforeConfirm() {
    if (!nomeOk) return "Informe seu nome.";
    if (!contatoOk) return "Informe um WhatsApp ou e-mail para contato.";
    if (selected?.needsText && !msgOk) return "Escreva sua mensagem.";

    if (!email && telefone.length < 10) {
      return "Informe um WhatsApp com DDD (somente números) ou um e-mail válido.";
    }
    return "";
  }

  async function confirmSend() {
    const payload = {
      tipo: safeTipo, // ✅ "MENSAGEM" | "VELA" | "LIVRO" | "FLOR"
      nome: nomeOk,
      ...(email ? { email } : {}),
      ...(telefone ? { telefone } : {}),
      ...(selected?.needsText ? { mensagem: msgOk } : {}),
    };

    if (import.meta.env.DEV) {
      console.log("[TributeForm] confirmSend →", {
        obitoId,
        tipo: payload.tipo,
        nome: short(payload.nome, 60),
        email: payload.email ? "[ok]" : "",
        telefone: payload.telefone ? "[ok]" : "",
        mensagem: payload.mensagem ? `[len=${payload.mensagem.length}]` : "",
      });
    }

    try {
      setSending(true);
      await onSubmit?.(obitoId, payload);

      setNome("");
      setContato("");
      setMensagem("");
      setTipo("MENSAGEM");
      setErr("");
      setTermsOpen(false);
    } catch (e) {
      console.error("[TributeForm] erro:", e);
      const isDev = import.meta.env.DEV;
      setErr(
        isDev ? String(e?.message || e) : "Não foi possível enviar sua homenagem. Tente novamente."
      );
      setTermsOpen(false);
    } finally {
      setSending(false);
    }
  }

  function submit(ev) {
    setErr("");
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    const v = validateBeforeConfirm();
    if (v) return setErr(v);

    // ✅ condicionado ao envio: só aparece quando o usuário realmente vai enviar
    setTermsOpen(true);
  }

  // CTA bar sticky (mobile): facilita MUITO, iOS-like
  const stickyCtaRef = useRef(null);
  useEffect(() => {
    // apenas garante repaint em iOS/Android quando teclado abre/fecha
    const onResize = () => {
      if (stickyCtaRef.current) stickyCtaRef.current.style.transform = "translateZ(0)";
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const ring = highContrast
    ? "ring-black/30 dark:ring-white/30"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  const contactIcon = isEmail(contatoOk) ? AtSign : Phone;
  const ContactIcon = contactIcon;

  return (
    <>
      <HairlineCard className={clsx("p-4 sm:p-6", ring)}>
        <SubtleBg />

        <div className="relative">
          {/* Header (calmo, premium) */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]">
                <Sparkles className="h-3.5 w-3.5 opacity-80" />
                Homenagem
              </span>

              <h3 className="mt-3 text-[16px] sm:text-xl font-semibold tracking-[-0.01em] text-[var(--text)]">
                Deixe sua homenagem
              </h3>

              <p className="mt-1.5 text-sm text-[var(--text)] opacity-85 leading-relaxed">
                Seu gesto ficará registrado no memorial de{" "}
                <span className="font-semibold">{nomeFalecido}</span>.
              </p>
            </div>
          </div>

          {/* Seletor redesenhado (menos poluído) */}
          <ReactionPicker value={safeTipo} onChange={(k) => setTipo(k)} />

          {/* “Context chip” (deixa o usuário seguro do que está fazendo) */}
          <div className="mt-3">
            <div
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1",
                "bg-[color:color-mix(in_srgb,var(--surface)_70%,transparent)]",
                "ring-[color:color-mix(in_srgb,var(--c-border)_60%,transparent)]"
              )}
            >
              {(() => {
                const Icon = selected?.icon || MessageSquareText;
                return <Icon className="h-4 w-4 opacity-80" />;
              })()}
              <span className="text-xs font-semibold text-[var(--text)] opacity-90">
                {selected?.needsText
                  ? "Mensagem pública no memorial"
                  : `Registro de ${selected?.label?.toLowerCase?.() || "reação"} no memorial`}
              </span>
            </div>
          </div>

          {/* Mensagem (somente quando necessário) */}
          {selected?.needsText && (
            <div className="mt-5">
              <Field
                label="Sua mensagem"
                hint={`${Math.min(mensagem.length, 600)}/600`}
              >
                <InputShell
                  icon={MessageSquareText}
                  right={
                    <span className="select-none text-[10px] font-semibold rounded-full px-2 py-1 ring-1 bg-[color:color-mix(in_srgb,var(--surface)_65%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_55%,transparent)] text-[var(--text)] opacity-80">
                      Público
                    </span>
                  }
                >
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    onInput={(e) => setMensagem(e.currentTarget.value)}
                    rows={4}
                    maxLength={600}
                    className={clsx(
                      "w-full rounded-2xl px-3 py-3 bg-transparent",
                      "text-[var(--text)] outline-none",
                      "placeholder:text-[color:color-mix(in_srgb,var(--text)_45%,transparent)]",
                      "resize-none"
                    )}
                    placeholder="Escreva uma homenagem com carinho…"
                    name="tribute_message"
                  />
                </InputShell>

                <p className="mt-2 text-xs text-[var(--text)] opacity-70 leading-relaxed">
                  Evite dados sensíveis. Sua mensagem ficará visível no memorial.
                </p>
              </Field>
            </div>
          )}

          {/* Campos essenciais (simples, rápido) */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Seu nome" hint="Como será exibido">
              <InputShell icon={User}>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onInput={(e) => setNome(e.currentTarget.value)}
                  className={clsx(
                    "w-full rounded-2xl px-3 py-3 bg-transparent",
                    "text-[var(--text)] outline-none",
                    "placeholder:text-[color:color-mix(in_srgb,var(--text)_45%,transparent)]"
                  )}
                  placeholder="Digite seu nome"
                  autoComplete="name"
                  name="tribute_name"
                />
              </InputShell>
            </Field>

            <Field label="WhatsApp ou e-mail" hint="Não aparece no memorial">
              <InputShell icon={ContactIcon}>
                <input
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  onInput={(e) => setContato(e.currentTarget.value)}
                  className={clsx(
                    "w-full rounded-2xl px-3 py-3 bg-transparent",
                    "text-[var(--text)] outline-none",
                    "placeholder:text-[color:color-mix(in_srgb,var(--text)_45%,transparent)]"
                  )}
                  placeholder="Ex.: maria@email.com ou 11999998888"
                  inputMode="text"
                  autoComplete="email"
                  name="tribute_contact"
                />
              </InputShell>

            </Field>
          </div>

          {/* Termos (informativo, sem checkbox) */}
          <div className="mt-4 rounded-2xl px-3.5 py-3 bg-[color:color-mix(in_srgb,var(--surface-alt)_70%,transparent)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl ring-1 bg-[color:color-mix(in_srgb,var(--surface)_65%,transparent)] ring-[color:color-mix(in_srgb,var(--c-border)_55%,transparent)]">
                <ShieldCheck className="h-[18px] w-[18px] opacity-85" />
              </span>

              <p className="text-sm text-[var(--text)] opacity-90 leading-relaxed">
                Ao enviar, você concorda com os{" "}
                <a className="underline font-semibold" href={termosHref} target="_blank" rel="noreferrer">
                  Termos
                </a>{" "}
                e a{" "}
                <a className="underline font-semibold" href={privacidadeHref} target="_blank" rel="noreferrer">
                  Política de Privacidade
                </a>
                .
              </p>
            </div>
          </div>

          {/* Erro */}
          {err ? (
            <div className="mt-3 rounded-2xl px-3.5 py-3 ring-1 ring-red-500/25 bg-red-500/10">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{err}</div>
              </div>
            </div>
          ) : null}

          {/* CTA (desktop) */}
          <div className="mt-5 hidden sm:flex items-center justify-end">
            <CTAButton
              type="button"
              onClick={submit}
              disabled={!canSend}
              className="w-auto"
            >
              {sending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando…
                </span>
              ) : (
                "Enviar homenagem"
              )}
            </CTAButton>
          </div>
        </div>
      </HairlineCard>

      {/* CTA sticky (mobile) — facilita MUITO */}
      <div className="sm:hidden">
        <div className="h-20" aria-hidden="true" />
        <div
          ref={stickyCtaRef}
          className={clsx(
            "fixed left-0 right-0 bottom-0 z-[70]",
            "bg-[color:color-mix(in_srgb,var(--surface)_75%,transparent)] backdrop-blur-xl",
            "ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]",
            "shadow-[0_-18px_50px_rgba(0,0,0,.18)]"
          )}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-[var(--text)] opacity-70">Você está enviando</div>
                <div className="text-sm font-semibold text-[var(--text)] truncate">
                  {selected?.label || "Mensagem"}
                  {selected?.needsText ? "" : " (sem texto)"}
                </div>
              </div>

              <CTAButton type="button" onClick={submit} disabled={!canSend} className="shrink-0">
                {sending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando…
                  </span>
                ) : (
                  "Enviar"
                )}
              </CTAButton>
            </div>
          </div>
        </div>
      </div>

      {/* Modal premium – condicionado ao envio (sem checkbox) */}
      <ConfirmTermsModal
        open={termsOpen}
        onClose={() => (!sending ? setTermsOpen(false) : null)}
        onConfirm={confirmSend}
        termosHref={termosHref}
        privacidadeHref={privacidadeHref}
        loading={sending}
      />
    </>
  );
}
