// src/pages/RegisterPage.jsx
// RegisterPage – Apple-level (simplicidade + confiança)
// Ajustes aplicados:
// 1) Remove voz do campo e-mail (mantém voz nos demais campos que já tinham)
// 2) Ordem: Stepper + formulário (cards auxiliares removidos)
// 3) Stepper apenas com número (sem textos)
// 4) Harmonia de cor: remove “brancos” próximos de inputs/botões (usa surfaces)
// 5) Stepper sticky: ao rolar, bate no topo e fica sempre visível (com offset do header)
//
// ✅ Atualização solicitada (cores do Stepper):
// - Fundo do step (ativo e concluído) com a cor primária
// - Número/ícone com cor de alto contraste (usa --on-primary, fallback branco)
// - Conectores mais “premium”, legíveis em tema claro e escuro
//
// ✅ Upgrade Apple-level focado EXCLUSIVAMENTE na etapa de senha (UX + conversão):
// - Indicador de força (barra + rótulo humano)
// - Checklist “vivo” com feedback imediato e sem ruído
// - Aviso de Caps Lock (evita frustração)
// - Botão “Gerar senha forte” (opcional, seguro, 1 clique)
// - Botão “Copiar” (para colar em gerenciador de senhas)
// - Microcopy curto, orientado à ação, com foco em clareza
// - Confirmação com status imediato (match / mismatch)
// - Mantém toda a lógica anterior, sem quebrar nada

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useTenant from "@/store/tenant";
import useAuth from "@/store/auth";
import { registerUser } from "@/lib/authApi";
import { registrarDispositivoFcmWeb } from "@/lib/fcm";
import VoiceTextInput from "@/components/VoiceTextInput";
import DateSelectBR from "@/components/DateSelectBR";
import Button from "@/components/ui/Button.jsx";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";

/* =========================
   Estado inicial
========================= */

const initial = {
  nome: "",
  email: "",
  senha: "",
  confirmSenha: "",
  cpf: "",
  celular: "",
  dataNascimento: "",
  aceiteTermos: false,
  aceitePrivacidade: false,
};

function mapRegisterApiError(err) {
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === "string" ? err?.response?.data : null) ||
    err?.message ||
    "";

  const msg = String(raw).toLowerCase();

  if (msg.includes("cpf") && (msg.includes("cadastr") || msg.includes("exist") || msg.includes("duplic"))) {
    return "Este CPF já possui conta. Faça login ou recupere a senha.";
  }
  if (msg.includes("e-mail") || msg.includes("email")) {
    if (msg.includes("cadastr") || msg.includes("exist") || msg.includes("duplic")) {
      return "Este e-mail já possui conta. Faça login ou recupere a senha.";
    }
  }
  if (msg.includes("termos") || msg.includes("privacidade")) {
    return "É necessário aceitar os Termos de Uso e a Política de Privacidade.";
  }
  if (raw) return raw;
  return "Não foi possível concluir o cadastro. Tente novamente.";
}

/* =========================
   Validadores / formatters
========================= */

const onlyDigits = (s = "") => String(s || "").replace(/\D/g, "");

const isValidEmail = (e = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim());

function getPasswordChecks(s = "") {
  return {
    len: s.length >= 8,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    digit: /\d/.test(s),
  };
}
function isStrongPassword(s = "") {
  const c = getPasswordChecks(s);
  return c.len && c.upper && c.lower && c.digit;
}

function isValidCPF(cpf = "") {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let rest = sum % 11;
  const dv1 = rest < 2 ? 0 : 11 - rest;
  if (dv1 !== Number(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  rest = sum % 11;
  const dv2 = rest < 2 ? 0 : 11 - rest;
  return dv2 === Number(d[10]);
}

function formatCPF(v = "") {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneBR(v = "") {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
const phoneIsValid = (v = "") => {
  const d = onlyDigits(v);
  return d.length === 10 || d.length === 11;
};

/* =========================
   Normalizadores (mantidos)
========================= */

const DIGIT_WORDS = new Map([
  ["zero", "0"],
  ["um", "1"],
  ["uma", "1"],
  ["dois", "2"],
  ["duas", "2"],
  ["tres", "3"],
  ["três", "3"],
  ["quatro", "4"],
  ["cinco", "5"],
  ["seis", "6"],
  ["sete", "7"],
  ["oito", "8"],
  ["nove", "9"],
]);

function normalizeDigitsFromSpeech(input = "") {
  const raw = String(input || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";
  const parts = raw.split(" ");
  let out = "";
  for (const p of parts) {
    if (!p) continue;
    if (/^\d+$/.test(p)) {
      out += p;
      continue;
    }
    const digit = DIGIT_WORDS.get(p);
    if (digit) out += digit;
  }
  return out;
}

function normalizeNameFromSpeech(input = "") {
  let t = String(input || "").trim();
  if (!t) return "";
  t = t.replace(/[.,;:!]+$/g, "").replace(/\s+/g, " ");
  return t;
}

function normalizeEmailTyping(input = "") {
  let t = String(input || "").toLowerCase();
  t = t.replace(/\s+/g, "");
  t = t.replace(/[^a-z0-9@._+\-]/g, "");
  t = t.replace(/@{2,}/g, "@").replace(/\.{2,}/g, ".");
  t = t.replace(/\.@/g, "@").replace(/@\./g, "@");
  return t;
}

/* =========================
   Password UX helpers (Apple-level)
========================= */

function scorePassword(pw = "") {
  const s = String(pw || "");
  if (!s)
    return {
      score: 0,
      label: "Crie uma senha",
      hint: "Use 8+ caracteres com letras e número.",
    };

  const checks = getPasswordChecks(s);
  const variety =
    (checks.lower ? 1 : 0) +
    (checks.upper ? 1 : 0) +
    (checks.digit ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(s) ? 1 : 0);

  let score = 0;
  score += Math.min(40, s.length * 4);
  score += variety * 12;
  if (s.length >= 12) score += 8;
  if (s.length >= 16) score += 6;

  if (/^(.)\1{5,}$/.test(s)) score -= 20;
  if (/1234|abcd|senha|password/i.test(s)) score -= 20;

  score = Math.max(0, Math.min(100, score));

  let label = "Fraca";
  let hint = "Aumente o tamanho e misture letras e números.";
  if (score >= 40) {
    label = "Boa";
    hint = "Ótimo. Se puder, use 12+ caracteres.";
  }
  if (score >= 70) {
    label = "Forte";
    hint = "Perfeito. Você pode seguir.";
  }

  if (isStrongPassword(s) && s.length >= 12 && score < 70) {
    score = Math.max(score, 70);
    label = "Forte";
    hint = "Perfeito. Você pode seguir.";
  }

  return { score, label, hint };
}

function generatePassword(length = 14) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*_-+?";
  const all = upper + lower + digits + symbols;

  const cryptoObj = typeof window !== "undefined" ? window.crypto : null;
  const rand = (n) => {
    if (cryptoObj?.getRandomValues) {
      const buf = new Uint32Array(1);
      cryptoObj.getRandomValues(buf);
      return buf[0] % n;
    }
    return Math.floor(Math.random() * n);
  };

  const pick = (set) => set[rand(set.length)];
  let pw = "";
  pw += pick(upper);
  pw += pick(lower);
  pw += pick(digits);
  pw += pick(symbols);

  for (let i = pw.length; i < length; i++) pw += pick(all);

  const arr = pw.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

/* =========================
   UI pieces (Apple-simple)
========================= */

function FormPanel({ title, subtitle, plain, children }) {
  if (plain) {
    return (
      <div>
        {(title || subtitle) && (
          <header className="space-y-1 mb-6">
            {title && (
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--text)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border px-4 py-4 md:px-5 md:py-5"
      style={{
        background: "var(--surface-alt, color-mix(in srgb, var(--primary) 4%, var(--surface)))",
        borderColor: "var(--c-border)",
      }}
    >
      {(title || subtitle) && (
        <div className="space-y-1 mb-5 md:mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-[var(--text)]">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function AppleFieldGroup({ children }) {
  return (
    <div
      className="rounded-xl border overflow-hidden divide-y"
      style={{
        background: "var(--surface)",
        borderColor: "var(--c-border)",
      }}
    >
      {children}
    </div>
  );
}

function ApplePasswordField({
  id,
  label,
  inputRef,
  value,
  onChange,
  onKeyUp,
  show,
  onToggleShow,
  toggleLabel,
  placeholder,
  invalid,
  describedBy,
  name,
  autoComplete = "new-password",
}) {
  return (
    <div
      className={`relative px-4 py-3 ${invalid ? "bg-[color-mix(in_srgb,#dc2626_4%,transparent)]" : ""}`}
      style={{ borderColor: "var(--c-border)" }}
    >
      <label htmlFor={id} className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        ref={inputRef}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        onKeyUp={onKeyUp}
        className="w-full h-11 pr-10 bg-transparent border-0 p-0 text-base text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-0"
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 bottom-3.5 p-2 -mr-1 rounded-lg min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
        style={{ color: "var(--text-muted)" }}
        aria-label={toggleLabel}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function MasterCard({ children }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl md:rounded-3xl border shadow-sm"
      style={{
        background: "var(--surface)",
        borderColor: "var(--c-border)",
      }}
    >
      <div className="relative p-4 md:p-7">{children}</div>
    </div>
  );
}

/* =========================
   Stepper – só números (sticky)
========================= */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(!!mq.matches);
    sync();
    try {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    } catch {
      mq.addListener(sync);
      return () => mq.removeListener(sync);
    }
  }, []);
  return reduced;
}

function StepCircle({ n, active, done, onClick, disabled }) {
  const reduceMotion = usePrefersReducedMotion();
  const isPrimary = active || done;
  const onPrimary = "var(--on-primary, #ffffff)";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-10 w-10 md:h-12 md:w-12 rounded-full border inline-flex items-center justify-center font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-transform"
      style={{
        background: isPrimary
          ? "var(--primary)"
          : "var(--surface-alt, var(--surface))",
        borderColor: isPrimary
          ? "transparent"
          : "var(--c-border)",
        color: isPrimary ? onPrimary : "var(--text-muted)",
        boxShadow: active
          ? "0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent)"
          : "none",
        transform: active ? "scale(1.05)" : "scale(1)",
        transition: reduceMotion
          ? "none"
          : "transform 160ms ease, box-shadow 180ms ease, background 180ms ease",
      }}
      aria-current={active ? "step" : undefined}
      aria-label={`Etapa ${n}`}
      title={`Etapa ${n}`}
    >
      <span className="text-base" style={{ lineHeight: 1 }}>
        {done ? "✓" : n}
      </span>
    </button>
  );
}

function StepperDock({ step, onStep, drawerOpen, disabled }) {
  const [isMdUp, setIsMdUp] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia?.("(min-width: 768px)")?.matches ?? true;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    onChange();
    try {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }
  }, []);

  const hiddenMobile = !isMdUp && drawerOpen;
  const top = "calc(env(safe-area-inset-top, 0px) + 56px + 8px)";

  const trackOff = "var(--c-border)";
  const trackOn = "var(--primary)";

  const connectorStyle = (filled) => ({
    background: filled ? trackOn : trackOff,
    opacity: filled ? 1 : 0.6,
  });

  return (
    <div className={`${hiddenMobile ? "hidden" : ""} z-[40]`} style={{ position: "sticky", top }}>
      <div
        className="rounded-2xl border px-3 py-2.5 flex items-center justify-center gap-2 md:gap-3"
        style={{
          borderColor: "var(--c-border)",
          background: "var(--surface)",
          boxShadow: "0 1px 3px color-mix(in srgb, var(--text) 8%, transparent)",
        }}
      >
        <StepCircle n={1} active={step === 1} done={step > 1} disabled={disabled} onClick={() => onStep?.(1)} />
        <span aria-hidden="true" className="h-0.5 w-8 md:w-14 rounded-full" style={connectorStyle(step >= 2)} />
        <StepCircle n={2} active={step === 2} done={step > 2} disabled={disabled} onClick={() => onStep?.(2)} />
        <span aria-hidden="true" className="h-0.5 w-8 md:w-14 rounded-full" style={connectorStyle(step >= 3)} />
        <StepCircle n={3} active={step === 3} done={false} disabled={disabled} onClick={() => onStep?.(3)} />
      </div>
    </div>
  );
}

/* =========================
   Page
========================= */

export default function RegisterPage() {
  useTenant();

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth((s) => ({ login: s.login }));

  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorList, setErrorList] = useState([]);
  const [step, setStep] = useState(1);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ UX senha
  const [capsOn, setCapsOn] = useState(false);
  const [copyOk, setCopyOk] = useState(false);
  const [genOk, setGenOk] = useState(false);

  // ✅ transição leve entre etapas (sem libs; respeita reduce motion)
  const reduceMotion = usePrefersReducedMotion();
  const [stepFxOn, setStepFxOn] = useState(true);
  useEffect(() => {
    if (reduceMotion) return;
    setStepFxOn(false);
    const t = requestAnimationFrame(() => setStepFxOn(true));
    return () => cancelAnimationFrame(t);
  }, [step, reduceMotion]);

  const alertRef = useRef(null);
  const nomeRef = useRef(null);
  const emailRef = useRef(null);
  const senhaRef = useRef(null);
  const confirmRef = useRef(null);
  const cpfRef = useRef(null);
  const celRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-mobile-drawer-open") === "true";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const el = document.documentElement;
    const sync = () => setDrawerOpen(el.getAttribute("data-mobile-drawer-open") === "true");
    sync();

    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["data-mobile-drawer-open"] });
    return () => obs.disconnect();
  }, []);

  const ageFromISO = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d)) return null;
    const t = new Date();
    let a = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
    return a;
  };

  const idade = useMemo(() => ageFromISO(form.dataNascimento), [form.dataNascimento]);
  const idadeOk = idade !== null && idade >= 18 && idade <= 100;

  const nomeOk = useMemo(() => form.nome.trim().length >= 3, [form.nome]);
  const emailOk = useMemo(() => isValidEmail(form.email), [form.email]);
  const cpfOk = useMemo(() => isValidCPF(form.cpf), [form.cpf]);

  const senhaChecks = useMemo(() => getPasswordChecks(form.senha), [form.senha]);
  const senhaOk = useMemo(() => isStrongPassword(form.senha), [form.senha]);
  const confirmOk = useMemo(
    () => form.confirmSenha.length > 0 && form.confirmSenha === form.senha,
    [form.confirmSenha, form.senha]
  );
  const celularOk = useMemo(() => phoneIsValid(form.celular), [form.celular]);

  const step1Valid = nomeOk && cpfOk && idadeOk;
  const step2Valid = emailOk && celularOk;
  const termsOk = form.aceiteTermos && form.aceitePrivacidade;
  const step3Valid = senhaOk && confirmOk && termsOk;

  useEffect(() => {
    setError("");
  }, [form]);

  useEffect(() => {
    if (error) setTimeout(() => alertRef.current?.focus(), 0);
  }, [error]);

  function buildErrorList(values) {
    const items = [];
    const age = ageFromISO(values.dataNascimento);

    if (!(values.nome || "").trim()) items.push({ field: "nome", label: "Nome completo é obrigatório" });
    if (!isValidEmail(values.email)) items.push({ field: "email", label: "Informe um e-mail válido" });
    if (!isValidCPF(values.cpf)) items.push({ field: "cpf", label: "Informe um CPF válido" });
    if (!phoneIsValid(values.celular)) items.push({ field: "celular", label: "Informe um celular válido com DDD" });

    if (!values.dataNascimento || age === null) {
      items.push({ field: "dataNascimento", label: "Informe sua data de nascimento" });
    } else if (age < 18 || age > 100) {
      items.push({ field: "dataNascimento", label: "Você precisa ter entre 18 e 100 anos" });
    }

    if (!isStrongPassword(values.senha)) {
      items.push({
        field: "senha",
        label: "A senha precisa ter 8 caracteres com maiúscula, minúscula e número",
      });
    }

    if (!(values.confirmSenha && values.confirmSenha === values.senha)) {
      items.push({ field: "confirmSenha", label: "As senhas precisam ser iguais" });
    }

    if (!values.aceiteTermos || !values.aceitePrivacidade) {
      items.push({ field: "termos", label: "Aceite os Termos de Uso e a Política de Privacidade" });
    }

    return items;
  }

  function buildStepErrors(values, stepN) {
    const all = buildErrorList(values);
    const fields =
      stepN === 1 ? ["nome", "cpf", "dataNascimento"] :
      stepN === 2 ? ["email", "celular"] :
      stepN === 3 ? ["senha", "confirmSenha", "termos"] :
      null;
    return fields ? all.filter((it) => fields.includes(it.field)) : all;
  }

  function focusByField(field) {
    const map = {
      nome: nomeRef,
      email: emailRef,
      cpf: cpfRef,
      celular: celRef,
      senha: senhaRef,
      confirmSenha: confirmRef,
    };
    map[field]?.current?.focus();
  }

  const recomputeErrorsIfSubmitted = (next) => {
    if (!submitted) return;
    setErrorList(buildStepErrors(next, step));
  };

  const onChangeMasked =
    (name, formatter) =>
    (e) => {
      const raw = e.target.value || "";
      const nextVal = formatter(raw);
      const next = { ...form, [name]: nextVal };
      setForm(next);
      recomputeErrorsIfSubmitted(next);
    };

  const onPasteMasked = (name, formatter) => (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text") || "";
    const nextVal = formatter(pasted);
    const next = { ...form, [name]: nextVal };
    setForm(next);
    recomputeErrorsIfSubmitted(next);
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    if (step === 1) {
      setSubmitted(true);
      const list = buildStepErrors(form, 1);
      setErrorList(list);
      if (list.length > 0 || !step1Valid) {
        if (list[0]) focusByField(list[0].field);
        return;
      }
      setStep(2);
      setSubmitted(false);
      setErrorList([]);
      setTimeout(() => emailRef.current?.focus(), 0);
      return;
    }

    if (step === 2) {
      setSubmitted(true);
      const list = buildStepErrors(form, 2);
      setErrorList(list);
      if (list.length > 0 || !step2Valid) {
        if (list[0]) focusByField(list[0].field);
        return;
      }
      setStep(3);
      setSubmitted(false);
      setErrorList([]);
      setTimeout(() => senhaRef.current?.focus(), 0);
      return;
    }

    setSubmitted(true);
    const list = buildErrorList(form);
    setErrorList(list);
    if (list.length > 0 || !step3Valid) {
      if (list[0]) focusByField(list[0].field);
      return;
    }

    const rawFrom = location.state?.from;
    const from =
      typeof rawFrom === "string"
        ? rawFrom
        : rawFrom?.pathname
        ? `${rawFrom.pathname}${rawFrom.search || ""}${rawFrom.hash || ""}`
        : "/area";

    const identificador = form.email?.trim() || onlyDigits(form.cpf);
    const payload = {
      ...form,
      aceiteTermos: !!form.aceiteTermos,
      aceitePrivacidade: !!form.aceitePrivacidade,
    };

    try {
      setLoading(true);
      setError("");

      await registerUser(payload);
      await login(identificador, form.senha);

      try {
        await registrarDispositivoFcmWeb();
      } catch {}

      navigate(from, { replace: true });
    } catch (err) {
      setError(mapRegisterApiError(err));
      setTimeout(() => alertRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }

  const canGoBack = step > 1;

  const sendLabel = step === 3 ? "Criar conta" : "Continuar";

  const loginNavigationState = useMemo(
    () => (location.state?.from ? { from: location.state.from } : undefined),
    [location.state]
  );

  const inputBg = "var(--surface)";
  const inputBorder = "var(--c-border)";

  async function copyToClipboard(text) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1200);
    } catch {
      setCopyOk(false);
    }
  }

  function applyGeneratedPassword() {
    const pw = generatePassword(14);
    const next = { ...form, senha: pw, confirmSenha: pw };
    setForm(next);
    setShowPass(true);
    setGenOk(true);
    setTimeout(() => setGenOk(false), 4000);
    if (submitted) setErrorList(buildStepErrors(next, 3));
    setTimeout(() => confirmRef.current?.focus(), 0);
  }

  // ✅ resumo claro para leigo (sem poluição)
  const requirementsSummary = useMemo(() => {
    const missing = [];
    if (!senhaChecks.len) missing.push("8+ caracteres");
    if (!senhaChecks.upper) missing.push("1 maiúscula");
    if (!senhaChecks.lower) missing.push("1 minúscula");
    if (!senhaChecks.digit) missing.push("1 número");
    return missing;
  }, [senhaChecks]);

  const stepTransitionStyle = useMemo(() => {
    if (reduceMotion) return {};
    return {
      opacity: stepFxOn ? 1 : 0,
      transform: stepFxOn ? "translateY(0px)" : "translateY(8px)",
      transition: "opacity 180ms ease, transform 220ms ease",
      willChange: "opacity, transform",
    };
  }, [stepFxOn, reduceMotion]);

  return (
    <div className="w-full relative">
        <div className="flex flex-col gap-3 md:gap-5">
          <StepperDock
            step={step}
            drawerOpen={drawerOpen}
            disabled={loading}
            onStep={(n) => {
              if (n <= step) {
                setStep(n);
                setSubmitted(false);
                setErrorList([]);
                setTimeout(() => {
                  if (n === 1) nomeRef.current?.focus();
                  if (n === 2) emailRef.current?.focus();
                  if (n === 3) senhaRef.current?.focus();
                }, 0);
              }
            }}
          />

          {error && (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="rounded-2xl px-4 py-3 text-sm md:text-base border shadow-sm"
              style={{
                borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--text)",
              }}
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <MasterCard>
            <form onSubmit={onSubmit} noValidate>
              <fieldset
                disabled={loading}
                className="grid grid-cols-1 gap-6 items-start"
              >
                <FormPanel
                  plain={step === 3}
                  title={step === 3 ? "Proteja sua conta" : "Crie sua conta"}
                  subtitle={
                    step === 3
                      ? "Crie uma senha difícil de adivinhar."
                      : "Use o microfone nos campos disponíveis, se preferir."
                  }
                >
                  <div className="grid gap-4" style={stepTransitionStyle} key={step}>
                    {step === 1 && (
                      <div className="space-y-5">
                        <div>
                          <label htmlFor="nome" className="label font-medium text-sm md:text-base">
                            Nome completo <span aria-hidden="true" className="text-red-600">*</span>
                          </label>

                          <VoiceTextInput
                            id="nome"
                            name="nome"
                            inputRef={nomeRef}
                            value={form.nome}
                            onChange={(e) => {
                              const next = { ...form, nome: e.target.value };
                              setForm(next);
                              if (submitted) setErrorList(buildStepErrors(next, 1));
                            }}
                            onChangeValue={(nextVal) => {
                              const cleaned = normalizeNameFromSpeech(nextVal);
                              const next = { ...form, nome: cleaned };
                              setForm(next);
                              if (submitted) setErrorList(buildStepErrors(next, 1));
                            }}
                            className={`input h-12 text-base ${submitted && !nomeOk ? "ring-1 ring-red-500" : ""}`}
                            style={{ background: inputBg, borderColor: inputBorder }}
                            placeholder="Maria Oliveira"
                            autoComplete="name"
                            ariaRequired="true"
                            ariaInvalid={submitted && !nomeOk}
                            disabled={loading}
                            enableVoice
                            applyMode="replace"
                            normalizeTranscript={(t) => normalizeNameFromSpeech(t)}
                            idleHint="Toque no microfone para ditar seu nome"
                            listeningHint="Ao terminar toque no quadrado para concluir"
                          />

                          {submitted && !nomeOk && (
                            <p className="text-xs md:text-sm mt-1 text-red-600">Informe ao menos 3 caracteres.</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="cpf" className="label font-medium text-sm md:text-base">
                              CPF <span aria-hidden="true" className="text-red-600">*</span>
                            </label>

                            <VoiceTextInput
                              id="cpf"
                              name="cpf"
                              inputRef={cpfRef}
                              value={formatCPF(form.cpf)}
                              onChange={onChangeMasked("cpf", formatCPF)}
                              onPaste={onPasteMasked("cpf", formatCPF)}
                              onChangeValue={(spoken) => {
                                const digits = normalizeDigitsFromSpeech(spoken).slice(0, 11);
                                const formatted = formatCPF(digits);
                                const next = { ...form, cpf: formatted };
                                setForm(next);
                                if (submitted) setErrorList(buildStepErrors(next, 1));
                              }}
                              className={`input h-12 text-base ${submitted && !cpfOk ? "ring-1 ring-red-500" : ""}`}
                              style={{ background: inputBg, borderColor: inputBorder }}
                              placeholder="000.000.000-00"
                              inputMode="numeric"
                              autoComplete="off"
                              ariaRequired="true"
                              ariaInvalid={submitted && !cpfOk}
                              disabled={loading}
                              enableVoice
                              applyMode="replace"
                              idleHint="Toque no microfone e fale os números do CPF"
                              listeningHint="Ao terminar toque no quadrado para concluir"
                            />

                            {submitted && !cpfOk && (
                              <p className="text-xs md:text-sm mt-1 text-red-600">
                                CPF inválido. Verifique os números digitados.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="label font-medium text-sm md:text-base">
                              Data de nascimento <span aria-hidden="true" className="text-red-600">*</span>
                            </label>

                            <DateSelectBR
                              idPrefix="reg-nasc"
                              valueISO={form.dataNascimento}
                              onChangeISO={(iso) => {
                                const next = { ...form, dataNascimento: iso };
                                setForm(next);
                                if (submitted) setErrorList(buildStepErrors(next, 1));
                              }}
                              minAge={18}
                              maxAge={100}
                              invalid={submitted && (!form.dataNascimento || !idadeOk)}
                            />

                            {submitted && (!form.dataNascimento || !idadeOk) && (
                              <p className="text-xs md:text-sm mt-1 text-red-600">
                                É preciso ter entre <b>18</b> e <b>100</b> anos.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="email" className="label font-medium text-sm md:text-base">
                              E-mail <span aria-hidden="true" className="text-red-600">*</span>
                            </label>

                            <input
                              id="email"
                              name="email"
                              ref={emailRef}
                              value={form.email}
                              onChange={(e) => {
                                const v = normalizeEmailTyping(e.target.value || "");
                                const next = { ...form, email: v };
                                setForm(next);
                                recomputeErrorsIfSubmitted(next);
                              }}
                              type="text"
                              inputMode="email"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              className={`input h-12 text-base ${submitted && !emailOk ? "ring-1 ring-red-500" : ""}`}
                              style={{ background: inputBg, borderColor: inputBorder }}
                              placeholder="maria@exemplo.com"
                              autoComplete="email"
                              aria-required="true"
                              aria-invalid={submitted && !emailOk}
                              disabled={loading}
                            />

                            {submitted && !emailOk && (
                              <p className="text-xs md:text-sm mt-1 text-red-600">Informe um e-mail válido.</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="celular" className="label font-medium text-sm md:text-base">
                              Celular <span aria-hidden="true" className="text-red-600">*</span>
                            </label>

                            <VoiceTextInput
                              id="celular"
                              name="celular"
                              inputRef={celRef}
                              value={formatPhoneBR(form.celular)}
                              onChange={onChangeMasked("celular", formatPhoneBR)}
                              onPaste={onPasteMasked("celular", formatPhoneBR)}
                              onChangeValue={(spoken) => {
                                const digits = normalizeDigitsFromSpeech(spoken).slice(0, 11);
                                const formatted = formatPhoneBR(digits);
                                const next = { ...form, celular: formatted };
                                setForm(next);
                                recomputeErrorsIfSubmitted(next);
                              }}
                              className={`input h-12 text-base ${submitted && !celularOk ? "ring-1 ring-red-500" : ""}`}
                              style={{ background: inputBg, borderColor: inputBorder }}
                              placeholder="(00) 90000-0000"
                              inputMode="tel"
                              autoComplete="tel"
                              ariaRequired="true"
                              ariaInvalid={submitted && !celularOk}
                              disabled={loading}
                              enableVoice
                              applyMode="replace"
                              idleHint="Toque no microfone e fale os números com DDD"
                              listeningHint="Ao terminar toque no quadrado para concluir"
                            />

                            {submitted && !celularOk && (
                              <p className="text-xs md:text-sm mt-1 text-red-600">
                                Informe um celular válido com DDD.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-5">
                        <AppleFieldGroup>
                          <ApplePasswordField
                            id="senha"
                            label="Senha"
                            inputRef={senhaRef}
                            name="senha"
                            value={form.senha}
                            onChange={(e) => {
                              const next = { ...form, senha: e.target.value };
                              setForm(next);
                              recomputeErrorsIfSubmitted(next);
                            }}
                            onKeyUp={(e) => {
                              try {
                                setCapsOn(!!e.getModifierState?.("CapsLock"));
                              } catch {}
                            }}
                            show={showPass}
                            onToggleShow={() => setShowPass((v) => !v)}
                            toggleLabel={showPass ? "Ocultar senha" : "Mostrar senha"}
                            placeholder="Senha"
                            invalid={submitted && !senhaOk}
                            describedBy="senha-feedback senha-policy"
                          />
                          <ApplePasswordField
                            id="confirmSenha"
                            label="Confirmar senha"
                            inputRef={confirmRef}
                            value={form.confirmSenha}
                            onChange={(e) => {
                              const next = { ...form, confirmSenha: e.target.value };
                              setForm(next);
                              recomputeErrorsIfSubmitted(next);
                            }}
                            show={showConfirm}
                            onToggleShow={() => setShowConfirm((v) => !v)}
                            toggleLabel={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                            placeholder="Repita a senha"
                            invalid={submitted && !confirmOk}
                            describedBy="confirm-feedback senha-policy"
                          />
                        </AppleFieldGroup>

                        <p id="senha-policy" className="sr-only">
                          A senha precisa de 8 ou mais caracteres, com letra maiúscula, minúscula e número.
                        </p>

                        <div id="senha-feedback" className="space-y-1 px-1 min-h-[1.25rem]" aria-live="polite">
                          {capsOn && (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              Caps Lock está ativado.
                            </p>
                          )}
                          {submitted && !senhaOk && (
                            <p className="text-xs text-red-600">
                              {requirementsSummary.length > 0
                                ? `A senha precisa de ${requirementsSummary.join(", ")}.`
                                : "Escolha uma senha mais forte."}
                            </p>
                          )}
                          {genOk && (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                              Senha sugerida.{" "}
                              <button
                                type="button"
                                onClick={() => copyToClipboard(form.senha)}
                                className="font-medium hover:underline"
                                style={{ color: "var(--primary)" }}
                              >
                                {copyOk ? "Copiada" : "Copiar"}
                              </button>
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => applyGeneratedPassword()}
                          disabled={loading}
                          className="w-full text-center text-sm font-medium min-h-[44px] hover:underline disabled:opacity-50"
                          style={{ color: "var(--primary)" }}
                        >
                          Sugerir senha segura
                        </button>

                        <div id="confirm-feedback" className="px-1 min-h-[1rem]" aria-live="polite">
                          {form.confirmSenha.length > 0 && !confirmOk && (
                            <p className="text-xs text-red-600">As senhas não coincidem.</p>
                          )}
                          {submitted && !confirmOk && form.confirmSenha.length === 0 && (
                            <p className="text-xs text-red-600">Confirme sua senha.</p>
                          )}
                        </div>

                        <label
                          className={`flex items-start gap-3 pt-1 cursor-pointer min-h-[44px] ${
                            submitted && !termsOk ? "ring-1 ring-red-500 rounded-lg px-1 -mx-1" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border shrink-0"
                            style={{ borderColor: "var(--c-border)" }}
                            checked={form.aceiteTermos && form.aceitePrivacidade}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const next = {
                                ...form,
                                aceiteTermos: checked,
                                aceitePrivacidade: checked,
                              };
                              setForm(next);
                              if (submitted) setErrorList(buildStepErrors(next, 3));
                            }}
                            aria-required="true"
                            aria-invalid={submitted && !termsOk}
                          />
                          <span className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            Li e aceito os{" "}
                            <a href="/termos-uso" target="_blank" rel="noreferrer" className="underline">
                              Termos de Uso
                            </a>{" "}
                            e a{" "}
                            <a href="/politica-privacidade" target="_blank" rel="noreferrer" className="underline">
                              Política de Privacidade
                            </a>
                            .
                          </span>
                        </label>
                        {submitted && !termsOk && (
                          <p className="text-xs text-red-600 px-1">
                            Aceite os termos para continuar.
                          </p>
                        )}
                      </div>
                    )}

                    {submitted && errorList.length > 0 && (
                      <div
                        className="rounded-2xl px-4 py-3 text-sm md:text-base border"
                        style={{
                          borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
                          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                          color: "var(--text)",
                        }}
                        role="alert"
                        aria-live="assertive"
                      >
                        <p className="font-medium mb-1">Revise os campos destacados</p>
                        <ul className="list-disc ml-5 space-y-1">
                          {errorList.map((it, idx) => (
                            <li key={idx}>
                              <button
                                type="button"
                                className="underline hover:opacity-80"
                                onClick={() => focusByField(it.field)}
                              >
                                {it.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Bottom bar */}
                    <div className="sticky bottom-0 pt-4 md:pt-2 pb-1">
                      <div className="flex flex-col gap-3">
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          full
                          loading={loading}
                          disabled={loading}
                          className="min-h-[48px] font-semibold rounded-xl md:rounded-full"
                        >
                          {!loading && <ArrowRight size={18} aria-hidden="true" />}
                          {loading ? "Processando…" : sendLabel}
                        </Button>

                        {canGoBack ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            full
                            onClick={() => {
                              const prev = Math.max(1, step - 1);
                              setStep(prev);
                              setSubmitted(false);
                              setErrorList([]);
                              setTimeout(() => {
                                if (prev === 1) nomeRef.current?.focus();
                                if (prev === 2) emailRef.current?.focus();
                                if (prev === 3) senhaRef.current?.focus();
                              }, 0);
                            }}
                            className="min-h-[48px] rounded-xl md:rounded-full md:w-auto md:px-6"
                          >
                            <ChevronLeft size={18} />
                            Voltar
                          </Button>
                        ) : (
                          <Link
                            to="/login"
                            state={loginNavigationState}
                            className="w-full inline-flex items-center justify-center min-h-[48px] rounded-xl md:rounded-full text-sm font-medium border transition"
                            style={{
                              background: "var(--surface)",
                              borderColor: "var(--c-border)",
                              color: "var(--text)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "var(--nav-hover-bg, color-mix(in srgb, var(--primary) 8%, var(--surface)))";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--surface)";
                            }}
                          >
                            Já tenho conta
                          </Link>
                        )}
                      </div>

                      <p
                        className="mt-4 text-xs text-center leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Seus dados são tratados conforme a LGPD.
                      </p>

                      {canGoBack && (
                        <p className="mt-3 text-center text-sm md:hidden" style={{ color: "var(--text-muted)" }}>
                          Já tem conta?{" "}
                          <Link
                            to="/login"
                            state={loginNavigationState}
                            className="font-semibold hover:underline"
                            style={{ color: "var(--primary)" }}
                          >
                            Fazer login
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                </FormPanel>
              </fieldset>
            </form>
          </MasterCard>
        </div>
    </div>
  );
}
