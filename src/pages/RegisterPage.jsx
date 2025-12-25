// src/pages/RegisterPage.jsx
// RegisterPage – Apple-level (simplicidade + confiança)
// Ajustes aplicados:
// 1) Remove voz do campo e-mail (mantém voz nos demais campos que já tinham)
// 2) Ordem: a) Criar conta  b) Stepper  c) Dica
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
import {
  AlertTriangle,
  UserPlus,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  Mail,
  User,
  Phone,
  Fingerprint,
  Eye,
  EyeOff,
  Copy,
  Wand2,
  Check,
  X,
  LockKeyhole,
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
  aceiteTermos: true,
  aceitePrivacidade: true,
};

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

function StrengthPill({ score, label }) {
  const width = `${Math.max(6, Math.min(100, score))}%`;
  const strong = score >= 70;
  const good = score >= 40 && score < 70;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border"
            style={{
              background: "color-mix(in srgb, var(--primary) 14%, transparent)",
              borderColor: "color-mix(in srgb, var(--primary) 24%, transparent)",
              color: "var(--primary)",
            }}
            aria-hidden="true"
          >
            <LockKeyhole size={14} />
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Força:{" "}
            <span style={{ color: strong || good ? "var(--text)" : "var(--text-muted)" }}>
              {label}
            </span>
          </span>
        </div>

        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {score}%
        </span>
      </div>

      <div
        className="h-2 rounded-full overflow-hidden border"
        style={{
          background: "color-mix(in srgb, var(--text) 8%, transparent)",
          borderColor: "color-mix(in srgb, var(--text) 12%, transparent)",
        }}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full"
          style={{
            width,
            background: `linear-gradient(90deg,
              color-mix(in srgb, var(--primary) ${Math.min(88, 35 + score * 0.6)}%, transparent),
              color-mix(in srgb, var(--primary) ${Math.min(95, 45 + score * 0.6)}%, transparent)
            )`,
            boxShadow: score >= 40 ? "0 10px 18px rgba(0,0,0,0.10)" : "none",
            transition: "width 180ms ease",
          }}
        />
      </div>
    </div>
  );
}

function LiveCheck({ ok, text }) {
  return (
    <li className="flex items-start gap-2 text-xs md:text-sm">
      <span
        className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border"
        style={{
          background: ok
            ? "color-mix(in srgb, var(--primary) 16%, transparent)"
            : "color-mix(in srgb, var(--text) 10%, transparent)",
          borderColor: ok
            ? "color-mix(in srgb, var(--primary) 30%, transparent)"
            : "color-mix(in srgb, var(--text) 14%, transparent)",
          color: ok ? "var(--primary)" : "var(--text-muted)",
          flex: "0 0 auto",
        }}
        aria-hidden="true"
      >
        {ok ? <Check size={12} /> : <X size={12} />}
      </span>
      <span style={{ color: ok ? "var(--text)" : "var(--text-muted)" }}>{text}</span>
    </li>
  );
}

/* =========================
   DateSelectBR (mantido)
========================= */

function DateSelectBR({
  valueISO,
  onChangeISO,
  invalid = false,
  className = "",
  maxAge = 100,
  minAge = 18,
  idPrefix,
}) {
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [softWarn, setSoftWarn] = useState("");

  useEffect(() => {
    const m =
      typeof valueISO === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueISO);
    if (!m) return;
    const [, yy, mm, dd] = m;
    if (ano !== yy) setAno(yy);
    if (mes !== mm) setMes(mm);
    if (dia !== dd) setDia(dd);
  }, [valueISO]); // eslint-disable-line

  const today = new Date();
  const minDate = (() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - (maxAge || 100));
    return d;
  })();
  const maxDate = (() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - (minAge || 18));
    return d;
  })();

  const minY = minDate.getFullYear();
  const maxY = maxDate.getFullYear();

  const anos = useMemo(() => {
    const arr = [];
    for (let y = maxY; y >= minY; y--) arr.push(String(y));
    return arr;
  }, [minY, maxY]);

  const mesesAll = [
    ["01", "Janeiro"],
    ["02", "Fevereiro"],
    ["03", "Março"],
    ["04", "Abril"],
    ["05", "Maio"],
    ["06", "Junho"],
    ["07", "Julho"],
    ["08", "Agosto"],
    ["09", "Setembro"],
    ["10", "Outubro"],
    ["11", "Novembro"],
    ["12", "Dezembro"],
  ];
  const str2int = (s) => parseInt(s, 10) || 0;
  const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

  const mesesFiltrados = useMemo(() => {
    if (!ano) return mesesAll;
    const y = str2int(ano);
    const minM = y === minY ? minDate.getMonth() + 1 : 1;
    const maxM = y === maxY ? maxDate.getMonth() + 1 : 12;
    return mesesAll.filter(([v]) => {
      const mm = str2int(v);
      return mm >= minM && mm <= maxM;
    });
  }, [ano, minY, maxY]); // eslint-disable-line

  function clampDayIfNeeded(y, m, d) {
    if (!y || !m || !d) return d;
    const maxDMonth = daysInMonth(y, m);
    let minD = 1,
      maxD = maxDMonth;
    if (y === minY && m === minDate.getMonth() + 1) minD = minDate.getDate();
    if (y === maxY && m === maxDate.getMonth() + 1)
      maxD = Math.min(maxDMonth, maxDate.getDate());
    if (d < minD) return minD;
    if (d > maxD) return maxD;
    return d;
  }

  function inRange(iso) {
    const d = new Date(iso);
    const a = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const b = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    return !isNaN(d) && d >= a && d <= b;
  }

  useEffect(() => {
    setSoftWarn("");
    if (!(dia && mes && ano)) return;
    const iso = `${ano}-${mes}-${dia}`;
    const ok = inRange(iso);
    if (!ok) setSoftWarn("Data fora do intervalo permitido entre 18 e 100 anos");
    onChangeISO?.(iso);
  }, [dia, mes, ano]); // eslint-disable-line

  function handleChangeMes(nextMesStr) {
    setSoftWarn("");
    setMes(nextMesStr);
    const y = str2int(ano);
    const m = str2int(nextMesStr);
    const d = str2int(dia);
    if (y && m && d) {
      const dClamped = clampDayIfNeeded(y, m, d);
      if (dClamped !== d) {
        setDia(String(dClamped).padStart(2, "0"));
        setSoftWarn("Ajustamos o dia para o máximo permitido no mês");
      }
    }
  }

  const idDia = `${idPrefix || "date"}-dia`;
  const idMes = `${idPrefix || "date"}-mes`;
  const idAno = `${idPrefix || "date"}-ano`;

  const selectBg = "color-mix(in srgb, var(--surface-elevated) 92%, transparent)";

  return (
    <div>
      <div
        className={`grid grid-cols-3 gap-2 ${
          invalid ? "ring-1 ring-red-500 rounded-xl p-1" : ""
        } ${className}`}
      >
        <label htmlFor={idDia} className="sr-only">
          Dia
        </label>
        <select
          id={idDia}
          className="input h-12 text-base"
          style={{ background: selectBg }}
          value={dia}
          onChange={(e) => setDia(e.target.value)}
        >
          <option value="">Dia</option>
          {(() => {
            const y = parseInt(ano || "", 10) || 0;
            const m = parseInt(mes || "", 10) || 0;
            let minD = 1,
              maxD = 31;
            if (y && m) {
              const maxDMonth = daysInMonth(y, m);
              minD = y === minY && m === minDate.getMonth() + 1 ? minDate.getDate() : 1;
              maxD =
                y === maxY && m === maxDate.getMonth() + 1
                  ? Math.min(maxDMonth, maxDate.getDate())
                  : maxDMonth;
            }
            const arr = [];
            for (let d = minD; d <= maxD; d++) arr.push(String(d).padStart(2, "0"));
            return arr.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ));
          })()}
        </select>

        <label htmlFor={idMes} className="sr-only">
          Mês
        </label>
        <select
          id={idMes}
          className="input h-12 text-base"
          style={{ background: selectBg }}
          value={mes}
          onChange={(e) => handleChangeMes(e.target.value)}
        >
          <option value="">Mês</option>
          {mesesFiltrados.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <label htmlFor={idAno} className="sr-only">
          Ano
        </label>
        <select
          id={idAno}
          className="input h-12 text-base"
          style={{ background: selectBg }}
          value={ano}
          onChange={(e) => setAno(e.target.value)}
        >
          <option value="">Ano</option>
          {anos.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {(invalid || softWarn) && (
        <p
          className={`mt-1 text-xs md:text-sm inline-flex items-center gap-1 ${
            invalid ? "text-red-600" : "text-amber-600"
          }`}
          role="alert"
        >
          <AlertTriangle size={14} />{" "}
          {invalid ? "Você precisa ter entre 18 e 100 anos" : softWarn}
        </p>
      )}
    </div>
  );
}

/* =========================
   UI pieces (Apple-simple)
========================= */

function Rule({ ok, children }) {
  return (
    <li className="flex items-center gap-2 text-xs md:text-sm">
      <span
        aria-hidden="true"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
        style={{
          background: ok
            ? "color-mix(in srgb, var(--primary) 18%, transparent)"
            : "color-mix(in srgb, var(--text) 15%, transparent)",
          color: ok ? "var(--primary)" : "var(--text-muted)",
        }}
      >
        {ok ? "✓" : "•"}
      </span>
      <span style={{ color: ok ? "var(--text)" : "var(--text-muted)" }}>{children}</span>
    </li>
  );
}

function MasterCard({ children }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border shadow-xl"
      style={{
        background: "color-mix(in srgb, var(--surface) 88%, var(--text) 6%)",
        borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{
          background:
            "radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)",
          opacity: 0.6,
        }}
      />
      <div className="relative z-[1] p-5 md:p-7">{children}</div>
    </div>
  );
}

function FormPanel({ title, subtitle, children }) {
  return (
    <div
      className="rounded-2xl border px-4 py-4 md:px-5 md:py-5"
      style={{
        background: "color-mix(in srgb, var(--surface-elevated) 92%, var(--text) 5%)",
        borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
      }}
    >
      {(title || subtitle) && (
        <div className="space-y-1 mb-4">
          {title && <p className="text-xs md:text-sm font-semibold tracking-wide uppercase">{title}</p>}
          {subtitle && (
            <p className="text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
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
      className="h-11 w-11 md:h-12 md:w-12 rounded-full border inline-flex items-center justify-center font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: isPrimary
          ? "var(--primary)"
          : "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
        borderColor: isPrimary
          ? "color-mix(in srgb, var(--primary) 65%, #000 0%)"
          : "color-mix(in srgb, var(--text) 14%, transparent)",
        color: isPrimary ? onPrimary : "var(--text-muted)",
        boxShadow: active
          ? "0 14px 30px color-mix(in srgb, var(--primary) 28%, rgba(0,0,0,0.35))"
          : done
          ? "0 10px 22px rgba(0,0,0,0.10)"
          : "none",
        transform: active ? "translateY(-1px)" : "translateY(0)",
        transition: reduceMotion
          ? "none"
          : "transform 160ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease",
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
  const top = "calc(var(--app-header-h, 72px) + env(safe-area-inset-top, 0px) + 10px)";

  const trackOff = "color-mix(in srgb, var(--text) 12%, transparent)";
  const trackOn = "var(--primary)";

  const connectorStyle = (filled) => ({
    background: filled
      ? `linear-gradient(90deg, ${trackOn}, color-mix(in srgb, var(--primary) 70%, transparent))`
      : trackOff,
    boxShadow: filled ? "0 8px 18px rgba(0,0,0,0.10)" : "none",
  });

  return (
    <div className={`${hiddenMobile ? "hidden" : ""} z-[50]`} style={{ position: "sticky", top }}>
      <div
        className="rounded-[22px] border shadow-lg px-3 py-2.5 flex items-center justify-center gap-3"
        style={{
          background: "color-mix(in srgb, var(--surface) 86%, var(--text) 6%)",
          borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <StepCircle n={1} active={step === 1} done={step > 1} disabled={disabled} onClick={() => onStep?.(1)} />
        <span aria-hidden="true" className="h-[3px] w-10 md:w-14 rounded-full" style={connectorStyle(step >= 2)} />
        <StepCircle n={2} active={step === 2} done={step > 2} disabled={disabled} onClick={() => onStep?.(2)} />
        <span aria-hidden="true" className="h-[3px] w-10 md:w-14 rounded-full" style={connectorStyle(step >= 3)} />
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
  const step3Valid = senhaOk && confirmOk;

  useEffect(() => {
    setError("");
  }, [form]);

  useEffect(() => {
    if (error) setTimeout(() => alertRef.current?.focus(), 0);
  }, [error]);

  const passScore = useMemo(() => scorePassword(form.senha), [form.senha]);

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

    return items;
  }

  function buildStepErrors(values, stepN) {
    const all = buildErrorList(values);
    const fields =
      stepN === 1 ? ["nome", "cpf", "dataNascimento"] :
      stepN === 2 ? ["email", "celular"] :
      stepN === 3 ? ["senha", "confirmSenha"] :
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
    const payload = { ...form, aceiteTermos: true, aceitePrivacidade: true };

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
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === "string" ? err?.response?.data : null) ||
        "Não foi possível concluir o cadastro";
      setError(apiMsg);
      setTimeout(() => alertRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
  }

  const firstName = useMemo(() => {
    const n = (form.nome || "").trim();
    if (!n) return "";
    return n.split(" ")[0];
  }, [form.nome]);

  const canGoBack = step > 1;

  const headerHint =
    step === 1
      ? { icon: User, title: "Dados", text: "Informações básicas para validar seu acesso." }
      : step === 2
      ? { icon: Mail, title: "Contato", text: "E-mail e celular para recuperação e avisos." }
      : { icon: ShieldCheck, title: "Segurança", text: "Uma senha forte protege sua conta." };

  const IconHint = headerHint.icon;
  const sendLabel = step === 3 ? "Criar conta" : "Continuar";

  const asideInfo =
    step === 1
      ? { icon: Fingerprint, title: "Validação do titular", bullets: ["Evita fraudes", "Cadastro rápido", "Sem papelada"] }
      : step === 2
      ? { icon: Phone, title: "Recuperação e avisos", bullets: ["Recuperar senha", "Avisos do contrato", "Suporte"] }
      : { icon: ShieldCheck, title: "Senha forte", bullets: ["Mais proteção", "Menos tentativas indevidas", "Você altera depois"] };

  const AsideIcon = asideInfo.icon;

  const inputBg = "color-mix(in srgb, var(--surface-elevated) 92%, transparent)";

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
    setGenOk(true);
    setTimeout(() => setGenOk(false), 1200);
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
    <section className="section">
      <div className="container-max max-w-5xl relative">
        <div className="min-h-[60vh] py-6 md:py-8 flex flex-col gap-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-[48px]"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary) 14%, transparent) 0, transparent 70%)," +
                "radial-gradient(80% 80% at 12% 25%, color-mix(in srgb, var(--text) 9%, transparent) 0, transparent 60%)," +
                "radial-gradient(80% 80% at 90% 30%, color-mix(in srgb, var(--text) 7%, transparent) 0, transparent 60%)," +
                "linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, transparent), color-mix(in srgb, var(--surface) 82%, transparent))",
              maskImage:
                "radial-gradient(120% 90% at 50% 0%, #000 0, #000 45%, transparent 78%)",
              opacity: 0.95,
            }}
          />

          {/* a) Criar conta */}
          <header className="pt-1">
            <div
              className="rounded-3xl border shadow-lg px-4 py-3 flex items-center justify-between gap-3"
              style={{
                background: "color-mix(in srgb, var(--surface) 88%, var(--text) 6%)",
                borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border flex-shrink-0"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 16%, transparent)",
                    borderColor: "color-mix(in srgb, var(--primary) 32%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <UserPlus size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-semibold leading-tight truncate">Criar conta</p>
                  <p className="text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
                    3 etapas • rápido e seguro
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs md:text-sm"
                  style={{
                    borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                    background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                    color: "var(--text-muted)",
                  }}
                >
                  <IconHint size={14} style={{ color: "var(--primary)" }} />
                  <span className="truncate">{headerHint.title}</span>
                </span>
              </div>
            </div>
          </header>

          {/* b) Stepper (sticky) */}
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

          {/* c) Dica */}
          <div>
            <div
              className="rounded-3xl border px-4 py-3 flex items-start gap-3"
              style={{
                background: "color-mix(in srgb, var(--surface) 92%, transparent)",
                borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
              }}
            >
              <span
                className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-2xl border"
                style={{
                  background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)",
                  color: "var(--primary)",
                }}
                aria-hidden="true"
              >
                <IconHint size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm md:text-base font-semibold leading-tight" style={{ color: "var(--text)" }}>
                  {headerHint.title}
                </p>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step === 3 && firstName ? (
                    <>
                      {firstName}, falta pouco. {headerHint.text}
                    </>
                  ) : (
                    headerHint.text
                  )}
                </p>
              </div>
            </div>
          </div>

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
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)] gap-6 md:gap-8 items-start"
              >
                {/* FORM */}
                <FormPanel title="Crie sua conta" subtitle="Use o microfone nos campos disponíveis, se preferir.">
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
                            style={{ background: inputBg }}
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
                              style={{ background: inputBg }}
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
                              style={{ background: inputBg }}
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
                              style={{ background: inputBg }}
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

                    {/* =========================
                        STEP 3 – SENHA (despoluída, leiga-friendly)
                       ========================= */}
                    {step === 3 && (
                      <div className="space-y-4">
                        {/* Linha 1: Senha */}
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <label htmlFor="senha" className="label font-medium text-sm md:text-base">
                                Senha <span aria-hidden="true" className="text-red-600">*</span>
                              </label>
                              <p className="text-[11px] md:text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                Use 8+ caracteres com letras e número (ou gere automaticamente).
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => applyGeneratedPassword()}
                              className="inline-flex items-center gap-2 rounded-full h-10 px-4 border text-xs md:text-sm font-semibold hover:opacity-90 active:opacity-80 flex-shrink-0"
                              style={{
                                background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                                borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)",
                                color: "var(--text)",
                              }}
                              disabled={loading}
                              title="Gerar senha forte"
                            >
                              <Wand2 size={16} style={{ color: "var(--primary)" }} />
                              {genOk ? "Gerada!" : "Gerar"}
                            </button>
                          </div>

                          <div className={`mt-2 relative ${submitted && !senhaOk ? "ring-1 ring-red-500 rounded-2xl" : ""}`}>
                            <input
                              id="senha"
                              type={showPass ? "text" : "password"}
                              name="senha"
                              ref={senhaRef}
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
                              className="input pr-[104px] h-12 text-xs sm:text-sm md:text-base"
                              style={{ background: inputBg }}
                              placeholder="Digite sua senha"
                              autoComplete="new-password"
                              aria-required="true"
                              aria-invalid={submitted && !senhaOk}
                              aria-describedby="senha-ux senha-policy"
                            />

                            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                              <button
                                type="button"
                                onClick={() => setShowPass((v) => !v)}
                                className="h-9 w-9 inline-flex items-center justify-center rounded-full border hover:opacity-90 active:opacity-80"
                                style={{
                                  background: "color-mix(in srgb, var(--surface) 86%, transparent)",
                                  borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                                  color: "var(--text)",
                                }}
                                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                                aria-pressed={showPass}
                                title={showPass ? "Ocultar" : "Mostrar"}
                              >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => copyToClipboard(form.senha || "")}
                                className="h-9 w-9 inline-flex items-center justify-center rounded-full border hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                  background: "color-mix(in srgb, var(--surface) 86%, transparent)",
                                  borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                                  color: "var(--text)",
                                }}
                                disabled={!form.senha}
                                aria-label="Copiar senha"
                                title={copyOk ? "Copiada!" : "Copiar"}
                              >
                                <Copy size={16} style={{ color: copyOk ? "var(--primary)" : "currentColor" }} />
                              </button>
                            </div>
                          </div>

                          {/* Feedback mínimo e claro */}
                          <div id="senha-ux" className="mt-2 space-y-2">
                            {capsOn && (
                              <div
                                className="rounded-2xl px-3 py-2 border text-xs md:text-sm inline-flex items-center gap-2"
                                style={{
                                  background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                                  borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)",
                                  color: "var(--text)",
                                }}
                                role="status"
                              >
                                <AlertTriangle size={14} style={{ color: "var(--primary)" }} />
                                Caps Lock ativado
                              </div>
                            )}

                            {/* Força: mantém a barra (alto valor), remove “cards” extras */}
                            <div
                              className="rounded-2xl px-4 py-3 border"
                              style={{
                                background: "color-mix(in srgb, var(--surface-elevated) 90%, transparent)",
                                borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                              }}
                            >
                              <StrengthPill score={passScore.score} label={passScore.label} />
                              <p className="mt-2 text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
                                {passScore.hint}
                              </p>

                              {/* Requisitos em 1 linha (para leigo) */}
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] md:text-xs font-semibold" style={{ color: "var(--text)" }}>
                                  Requisitos:
                                </span>

                                <span
                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] md:text-xs"
                                  style={{
                                    background: senhaChecks.len
                                      ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                                      : "color-mix(in srgb, var(--text) 7%, transparent)",
                                    borderColor: senhaChecks.len
                                      ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                                      : "color-mix(in srgb, var(--text) 14%, transparent)",
                                    color: senhaChecks.len ? "var(--text)" : "var(--text-muted)",
                                  }}
                                >
                                  {senhaChecks.len ? <Check size={12} style={{ color: "var(--primary)" }} /> : <X size={12} />}
                                  8+
                                </span>

                                <span
                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] md:text-xs"
                                  style={{
                                    background: senhaChecks.upper
                                      ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                                      : "color-mix(in srgb, var(--text) 7%, transparent)",
                                    borderColor: senhaChecks.upper
                                      ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                                      : "color-mix(in srgb, var(--text) 14%, transparent)",
                                    color: senhaChecks.upper ? "var(--text)" : "var(--text-muted)",
                                  }}
                                >
                                  {senhaChecks.upper ? <Check size={12} style={{ color: "var(--primary)" }} /> : <X size={12} />}
                                  A-Z
                                </span>

                                <span
                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] md:text-xs"
                                  style={{
                                    background: senhaChecks.lower
                                      ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                                      : "color-mix(in srgb, var(--text) 7%, transparent)",
                                    borderColor: senhaChecks.lower
                                      ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                                      : "color-mix(in srgb, var(--text) 14%, transparent)",
                                    color: senhaChecks.lower ? "var(--text)" : "var(--text-muted)",
                                  }}
                                >
                                  {senhaChecks.lower ? <Check size={12} style={{ color: "var(--primary)" }} /> : <X size={12} />}
                                  a-z
                                </span>

                                <span
                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] md:text-xs"
                                  style={{
                                    background: senhaChecks.digit
                                      ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                                      : "color-mix(in srgb, var(--text) 7%, transparent)",
                                    borderColor: senhaChecks.digit
                                      ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                                      : "color-mix(in srgb, var(--text) 14%, transparent)",
                                    color: senhaChecks.digit ? "var(--text)" : "var(--text-muted)",
                                  }}
                                >
                                  {senhaChecks.digit ? <Check size={12} style={{ color: "var(--primary)" }} /> : <X size={12} />}
                                  0-9
                                </span>
                              </div>

                              {/* Só mostra “detalhes” quando necessário (reduz poluição) */}
                              <details className="mt-3">
                                <summary
                                  className="text-xs md:text-sm font-semibold cursor-pointer select-none"
                                  style={{ color: "var(--text)" }}
                                >
                                  Ver detalhes
                                </summary>

                                <div
                                  id="senha-policy"
                                  className="mt-2 rounded-2xl px-4 py-3 border"
                                  style={{
                                    background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                                    borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                                  }}
                                  aria-live="polite"
                                >
                                  <p className="text-[11px] md:text-xs mb-2 font-semibold" style={{ color: "var(--text)" }}>
                                    Requisitos mínimos
                                  </p>
                                  <ul className="space-y-1.5">
                                    <LiveCheck ok={senhaChecks.len} text="8 ou mais caracteres" />
                                    <LiveCheck ok={senhaChecks.upper} text="1 letra maiúscula (A-Z)" />
                                    <LiveCheck ok={senhaChecks.lower} text="1 letra minúscula (a-z)" />
                                    <LiveCheck ok={senhaChecks.digit} text="1 número (0-9)" />
                                  </ul>
                                </div>
                              </details>

                              {senhaOk && (
                                <div
                                  className="mt-3 rounded-xl px-3 py-2 border text-xs md:text-sm inline-flex items-center gap-2"
                                  style={{
                                    background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                                    borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)",
                                    color: "var(--text)",
                                  }}
                                  role="status"
                                >
                                  <CheckCircle2 size={16} style={{ color: "var(--primary)" }} />
                                  Senha aprovada
                                </div>
                              )}

                              {submitted && !senhaOk && (
                                <p className="text-xs md:text-sm mt-3 text-red-600">
                                  Falta: <b>{requirementsSummary.join(", ")}</b>.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Linha 2: Confirmar */}
                        <div>
                          <label htmlFor="confirmSenha" className="label font-medium text-sm md:text-base">
                            Confirmar senha <span aria-hidden="true" className="text-red-600">*</span>
                          </label>

                          <div className={`mt-2 relative ${submitted && !confirmOk ? "ring-1 ring-red-500 rounded-2xl" : ""}`}>
                            <input
                              id="confirmSenha"
                              ref={confirmRef}
                              type={showConfirm ? "text" : "password"}
                              name="confirmSenha"
                              value={form.confirmSenha}
                              onChange={(e) => {
                                const next = { ...form, confirmSenha: e.target.value };
                                setForm(next);
                                recomputeErrorsIfSubmitted(next);
                              }}
                              className="input pr-[56px] h-12 text-xs sm:text-sm md:text-base"
                              style={{ background: inputBg }}
                              placeholder="Digite novamente"
                              autoComplete="new-password"
                              aria-required="true"
                              aria-invalid={submitted && !confirmOk}
                              aria-describedby="confirm-feedback"
                            />

                            <button
                              type="button"
                              onClick={() => setShowConfirm((v) => !v)}
                              className="absolute inset-y-0 right-0 my-auto mr-2 h-9 w-9 inline-flex items-center justify-center rounded-full border hover:opacity-90 active:opacity-80"
                              style={{
                                background: "color-mix(in srgb, var(--surface) 86%, transparent)",
                                borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                                color: "var(--text)",
                              }}
                              aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                              aria-pressed={showConfirm}
                              title={showConfirm ? "Ocultar" : "Mostrar"}
                            >
                              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          <div id="confirm-feedback" className="mt-2">
                            {form.confirmSenha.length > 0 && (
                              <div
                                className="rounded-2xl px-3 py-2 border text-xs md:text-sm inline-flex items-center gap-2"
                                style={{
                                  background: confirmOk
                                    ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                                    : "color-mix(in srgb, var(--text) 8%, transparent)",
                                  borderColor: confirmOk
                                    ? "color-mix(in srgb, var(--primary) 22%, transparent)"
                                    : "color-mix(in srgb, var(--text) 14%, transparent)",
                                  color: "var(--text)",
                                }}
                                role="status"
                              >
                                {confirmOk ? (
                                  <>
                                    <Check size={16} style={{ color: "var(--primary)" }} />
                                    Senhas conferem
                                  </>
                                ) : (
                                  <>
                                    <X size={16} style={{ color: "var(--text-muted)" }} />
                                    Não confere
                                  </>
                                )}
                              </div>
                            )}

                            {submitted && !confirmOk && (
                              <p className="text-xs md:text-sm mt-2 text-red-600">As senhas precisam ser iguais.</p>
                            )}
                          </div>

                          {/* Termos (mantido) — mais compacto */}
                          <div
                            className="mt-4 rounded-2xl px-4 py-3 border flex items-start gap-2"
                            style={{
                              background: "color-mix(in srgb, var(--surface-elevated) 90%, transparent)",
                              borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                            }}
                          >
                            <CheckCircle2 size={18} className="mt-0.5" style={{ color: "var(--primary)" }} />
                            <div className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                              Ao criar sua conta, você concorda com os{" "}
                              <a href="/termos-uso" target="_blank" rel="noreferrer" className="underline">
                                Termos de Uso
                              </a>{" "}
                              e a{" "}
                              <a href="/politica-privacidade" target="_blank" rel="noreferrer" className="underline">
                                Política de Privacidade
                              </a>
                              .
                            </div>
                          </div>
                        </div>
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

                    {/* Bottom bar – simples e direto */}
                    <div
                      className="sticky bottom-0 pt-2"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--surface-elevated) 92%, transparent) 30%, color-mix(in srgb, var(--surface-elevated) 96%, transparent) 100%)",
                        paddingBottom: 2,
                      }}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full h-12 px-6 text-[15px] md:text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                          disabled={loading}
                          style={{
                            background:
                              "linear-gradient(180deg, color-mix(in srgb, var(--primary) 88%, #000 0%), color-mix(in srgb, var(--primary) 74%, #000 0%))",
                            color: "var(--on-primary)",
                          }}
                        >
                          <span>{loading ? "Processando…" : sendLabel}</span>
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                            style={{
                              background: "color-mix(in srgb, var(--on-primary) 18%, transparent)",
                            }}
                            aria-hidden="true"
                          >
                            <ArrowRight size={16} />
                          </span>
                        </button>

                        {canGoBack ? (
                          <button
                            type="button"
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
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full h-12 px-6 text-sm md:text-base font-medium border hover:opacity-90"
                            style={{
                              background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                              borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                              color: "var(--text)",
                            }}
                          >
                            <ChevronLeft size={18} />
                            Voltar
                          </button>
                        ) : (
                          <Link
                            to="/login"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full h-12 px-6 text-sm md:text-base font-medium border hover:opacity-90"
                            style={{
                              background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                              borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                              color: "var(--text)",
                            }}
                          >
                            Já tenho conta
                          </Link>
                        )}
                      </div>

                      <p
                        className="mt-3 text-[11px] md:text-xs text-center leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Seus dados são tratados conforme a LGPD.
                      </p>
                    </div>
                  </div>
                </FormPanel>

                {/* COLUNA DIREITA – MINIMAL; escondida no mobile */}
                <aside
                  className="hidden md:flex rounded-2xl border px-5 py-5 flex-col justify-between gap-4"
                  style={{
                    background: "color-mix(in srgb, var(--surface-elevated) 94%, transparent)",
                    borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
                  }}
                >
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px]">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: "var(--primary)", color: "var(--on-primary, #fff)" }}
                      >
                        <AsideIcon size={12} />
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>{asideInfo.title}</span>
                    </div>

                    <ul className="mt-2 space-y-2 text-sm">
                      {asideInfo.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--primary)" }} />
                          <span style={{ color: "var(--text)" }}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="btn-outline w-full justify-center rounded-2xl h-11 md:h-12 text-sm md:text-base font-semibold"
                      disabled={loading}
                    >
                      Já tenho conta
                    </button>
                  </div>
                </aside>
              </fieldset>
            </form>
          </MasterCard>
        </div>
      </div>
    </section>
  );
}
