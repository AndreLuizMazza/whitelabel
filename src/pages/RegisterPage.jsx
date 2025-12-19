// src/pages/RegisterPage.jsx
// RegisterPage (WhatsApp-inspired premium)
// - Layout com “chat surface”: fundo com pattern sutil + cards como bubbles
// - CTA estilo “Enviar” (pill + ícone)
// - Campo e-mail blindado contra “sumir @” no mobile: autoCapitalize/autoCorrect/spellCheck e normalize mais permissivo em digitação
// - Ditado por voz: normalização suave (não destrói o que o usuário digitou)
// - Validação progressiva por etapas (3 passos)

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useTenant from "@/store/tenant";
import useAuth from "@/store/auth";
import { registerUser } from "@/lib/authApi";
import { registrarDispositivoFcmWeb } from "@/lib/fcm";
import VoiceTextInput from "@/components/VoiceTextInput";
import { AlertTriangle, UserPlus, Lock, CheckCircle2, ArrowRight, ChevronLeft } from "lucide-react";

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

/* -------------------- normalizadores de voz -------------------- */

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

/**
 * E-mail: duas rotas
 * - "typing": não tenta adivinhar demais (não remove @ final, não troca domínios agressivamente)
 * - "voiceFinal": pode aplicar regras mais fortes ao finalizar ditado
 *
 * Isso evita o caso clássico: o usuário está digitando "nome@" e o normalizador “conserta” antes da hora.
 */
function normalizeEmailTyping(input = "") {
  let t = String(input || "").toLowerCase();

  // remove espaços
  t = t.replace(/\s+/g, "");

  // permite apenas chars válidos
  t = t.replace(/[^a-z0-9@._+\-]/g, "");

  // evita @@ e .. repetidos
  t = t.replace(/@{2,}/g, "@").replace(/\.{2,}/g, ".");

  // não deixa ".@" ou "@." no meio
  t = t.replace(/\.@/g, "@").replace(/@\./g, "@");

  return t;
}

function normalizeEmailFromSpeechFinal(input = "") {
  let t = String(input || "").toLowerCase().trim();

  // pontuações viram espaço
  t = t.replace(/[,:;!]+/g, " ");

  // arroba
  t = t
    .replace(/\ba\s*roba\b/g, "@")
    .replace(/\baroba\b/g, "@")
    .replace(/\barroba\b/g, "@")
    .replace(/\s+@\s+/g, "@");

  // “at” isolado
  t = t.replace(/\bat\b/g, "@");

  // ponto
  t = t.replace(/\bponto\b/g, ".");

  // remove espaços
  t = t.replace(/\s+/g, "");

  // provedores comuns
  const providerMap = [
    ["gmail", "gmail.com"],
    ["hotmail", "hotmail.com"],
    ["outlook", "outlook.com"],
    ["icloud", "icloud.com"],
    ["yahoo", "yahoo.com"],
  ];
  for (const [spoken, domain] of providerMap) {
    t = t.replace(new RegExp(`@${spoken}(?![\\w.-])`, "g"), `@${domain}`);
  }

  // chars válidos
  t = t.replace(/[^a-z0-9@._+\-]/g, "");

  // saneamento
  t = t.replace(/@{2,}/g, "@").replace(/\.{2,}/g, ".");
  t = t.replace(/\.@/g, "@").replace(/@\./g, "@");
  t = t.replace(/[.,;:!]+$/g, "");

  // não termina com @ ou .
  t = t.replace(/[@.]+$/g, "");

  return t;
}

/* -------------------- date select -------------------- */

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

  return (
    <div>
      <div
        className={`grid grid-cols-3 gap-2 ${invalid ? "ring-1 ring-red-500 rounded-xl p-1" : ""} ${className}`}
      >
        <label htmlFor={idDia} className="sr-only">
          Dia
        </label>
        <select
          id={idDia}
          className="input h-12 text-base bg-white"
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
          className="input h-12 text-base bg-white"
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
          className="input h-12 text-base bg-white"
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
          <AlertTriangle size={14} /> {invalid ? "Você precisa ter entre 18 e 100 anos" : softWarn}
        </p>
      )}
    </div>
  );
}

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

function ChatBubble({ side = "left", title, children, tone = "neutral" }) {
  const left = side === "left";
  const bg =
    tone === "brand"
      ? "color-mix(in srgb, var(--primary) 16%, var(--surface) 84%)"
      : "color-mix(in srgb, var(--surface-elevated) 92%, transparent)";
  const border =
    tone === "brand"
      ? "color-mix(in srgb, var(--primary) 30%, transparent)"
      : "color-mix(in srgb, var(--text) 14%, transparent)";

  return (
    <div className={`flex ${left ? "justify-start" : "justify-end"}`}>
      <div
        className="max-w-[540px] rounded-2xl px-4 py-3 border shadow-sm"
        style={{
          background: bg,
          borderColor: border,
          borderTopLeftRadius: left ? 10 : 22,
          borderTopRightRadius: left ? 22 : 10,
        }}
      >
        {title ? (
          <p className="text-xs md:text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
            {title}
          </p>
        ) : null}
        <div className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function StepPills({ step }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n) => {
        const active = step === n;
        const done = step > n;
        return (
          <span
            key={n}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs md:text-sm"
            style={{
              borderColor: active
                ? "color-mix(in srgb, var(--primary) 40%, transparent)"
                : "color-mix(in srgb, var(--text) 14%, transparent)",
              background: active
                ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                : "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
              color: active ? "var(--text)" : "var(--text-muted)",
            }}
          >
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                background: done
                  ? "color-mix(in srgb, var(--primary) 28%, transparent)"
                  : active
                  ? "color-mix(in srgb, var(--primary) 22%, transparent)"
                  : "color-mix(in srgb, var(--text) 10%, transparent)",
                color: done || active ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              {done ? "✓" : n}
            </span>
            <span>{n === 1 ? "Dados" : n === 2 ? "Contato" : "Senha"}</span>
          </span>
        );
      })}
    </div>
  );
}

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

  const alertRef = useRef(null);
  const nomeRef = useRef(null);
  const emailRef = useRef(null);
  const senhaRef = useRef(null);
  const confirmRef = useRef(null);
  const cpfRef = useRef(null);
  const celRef = useRef(null);

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
        label: "A senha precisa ter 8 caracteres com maiúscula minúscula e número",
      });
    }

    if (!(values.confirmSenha && values.confirmSenha === values.senha)) {
      items.push({ field: "confirmSenha", label: "As senhas precisam ser iguais" });
    }

    return items;
  }

  function buildStepErrors(values, stepN) {
    const all = buildErrorList(values);
    const fields = stepN === 1 ? ["nome", "cpf", "dataNascimento"] : stepN === 2 ? ["email", "celular"] : null;
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

    // Step 1 -> Step 2
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

    // Step 2 -> Step 3
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

    // Final
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

  const chatHint =
    step === 1
      ? { title: "Vamos começar", text: "Preencha nome, CPF e data de nascimento. Se preferir, use o microfone." }
      : step === 2
      ? {
          title: "Agora seus contatos",
          text: "No e-mail, digite normalmente. No ditado, diga “arroba” e “ponto”.",
        }
      : { title: "Falta pouco", text: "Crie uma senha forte e confirme para finalizar." };

  const sendLabel = step === 3 ? "Criar conta" : "Continuar";
  const canGoBack = step > 1;

  return (
    <section className="section">
      <div className="container-max max-w-4xl relative">
        <div className="min-h-[60vh] py-8 flex flex-col justify-center">
          {/* WhatsApp-ish chat background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-[48px]"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary) 16%, transparent) 0, transparent 70%)," +
                "radial-gradient(80% 80% at 10% 20%, color-mix(in srgb, var(--text) 10%, transparent) 0, transparent 60%)," +
                "radial-gradient(80% 80% at 90% 30%, color-mix(in srgb, var(--text) 8%, transparent) 0, transparent 60%)," +
                "linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, transparent), color-mix(in srgb, var(--surface) 82%, transparent))",
              maskImage:
                "radial-gradient(120% 90% at 50% 0%, #000 0, #000 40%, transparent 75%)",
              opacity: 0.9,
            }}
          />

          {/* Top bar (WhatsApp vibe) */}
          <header className="mb-6">
            <div
              className="rounded-3xl border shadow-lg px-4 py-3 flex items-center justify-between gap-3"
              style={{
                background: "color-mix(in srgb, var(--surface) 88%, var(--text) 6%)",
                borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 18%, transparent)",
                    borderColor: "color-mix(in srgb, var(--primary) 32%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <UserPlus size={18} />
                </span>
                <div>
                  <p className="text-sm md:text-base font-semibold leading-tight">
                    Criar conta
                  </p>
                  <p className="text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
                    Cadastro rápido em 3 passos
                  </p>
                </div>
              </div>

              <div className="hidden sm:block">
                <StepPills step={step} />
              </div>
            </div>

            <div className="sm:hidden mt-3">
              <StepPills step={step} />
            </div>

            <div className="mt-4 space-y-3">
              <ChatBubble side="left" title={chatHint.title} tone="brand">
                {chatHint.text}
              </ChatBubble>

              {step === 3 && (
                <ChatBubble side="right" title="Perfeito" tone="neutral">
                  {firstName ? (
                    <>
                      {firstName}, seus dados já estão prontos. Agora é só definir a senha.
                    </>
                  ) : (
                    <>Seus dados já estão prontos. Agora é só definir a senha.</>
                  )}
                </ChatBubble>
              )}
            </div>
          </header>

          {error && (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="mb-4 rounded-2xl px-4 py-3 text-sm md:text-base border shadow-sm"
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

          <form
            onSubmit={onSubmit}
            className="relative overflow-hidden rounded-3xl border shadow-xl"
            style={{
              background: "color-mix(in srgb, var(--surface) 90%, var(--text) 5%)",
              borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
            }}
          >
            {/* subtle “chat wallpaper” inside form */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 10px 10px, color-mix(in srgb, var(--text) 8%, transparent) 0 1px, transparent 1px 100%)," +
                  "radial-gradient(circle at 35px 30px, color-mix(in srgb, var(--text) 7%, transparent) 0 1px, transparent 1px 100%)",
                backgroundSize: "48px 48px",
                opacity: 0.35,
              }}
            />

            <fieldset disabled={loading} className="relative z-[1] p-6 md:p-8 space-y-6">
              {/* Step content as “bubbles” */}
              {step === 1 && (
                <div className="space-y-4">
                  <ChatBubble side="left" title="Seus dados principais" tone="neutral">
                    Informe nome, CPF e nascimento para validar seu acesso com segurança.
                  </ChatBubble>

                  <div
                    className="rounded-3xl border p-5 md:p-6 space-y-5 shadow-sm"
                    style={{
                      background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                      borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                    }}
                  >
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
                        className={`input h-12 text-base bg-white ${submitted && !nomeOk ? "ring-1 ring-red-500" : ""}`}
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
                        <p className="text-xs md:text-sm mt-1 text-red-600">Informe ao menos 3 caracteres</p>
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
                          className={`input h-12 text-base bg-white ${submitted && !cpfOk ? "ring-1 ring-red-500" : ""}`}
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
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <ChatBubble side="left" title="Contato" tone="neutral">
                    No e-mail, o símbolo <b>@</b> deve funcionar normalmente. Se estiver no ditado, diga “arroba”.
                  </ChatBubble>

                  <ChatBubble side="left" title="Exemplo" tone="brand">
                    “maria oliveira <b>arroba</b> gmail <b>ponto</b> com”
                  </ChatBubble>

                  <div
                    className="rounded-3xl border p-5 md:p-6 space-y-5 shadow-sm"
                    style={{
                      background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                      borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="label font-medium text-sm md:text-base">
                          E-mail <span aria-hidden="true" className="text-red-600">*</span>
                        </label>

                        <VoiceTextInput
                          id="email"
                          name="email"
                          inputRef={emailRef}
                          value={form.email}
                          // IMPORTANTÍSSIMO: em digitação, use normalização leve (não “come” @)
                          onChange={(e) => {
                            const v = normalizeEmailTyping(e.target.value || "");
                            const next = { ...form, email: v };
                            setForm(next);
                            recomputeErrorsIfSubmitted(next);
                          }}
                          onChangeValue={(nextVal) => {
                            // ao receber texto de voz em tempo real, também aplica “typing”
                            const v = normalizeEmailTyping(nextVal || "");
                            const next = { ...form, email: v };
                            setForm(next);
                            recomputeErrorsIfSubmitted(next);
                          }}
                          // blindagem mobile para não interferir no @
                          type="text"
                          inputMode="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          className={`input h-12 text-base bg-white ${submitted && !emailOk ? "ring-1 ring-red-500" : ""}`}
                          placeholder="maria@exemplo.com"
                          autoComplete="email"
                          ariaRequired="true"
                          ariaInvalid={submitted && !emailOk}
                          disabled={loading}
                          enableVoice
                          // quando o VoiceTextInput sinalizar “final”, aplica normalização forte
                          normalizeTranscript={(text, ctx) => {
                            if (ctx?.mode === "final") return normalizeEmailFromSpeechFinal(text);
                            return normalizeEmailTyping(text);
                          }}
                          applyMode="email"
                          idleHint="Toque no microfone para ditar o e-mail"
                          listeningHint="Ao terminar toque no quadrado para concluir"
                        />

                        {submitted && !emailOk && (
                          <p className="text-xs md:text-sm mt-1 text-red-600">Informe um e-mail válido.</p>
                        )}

                        <p className="mt-2 text-[11px] md:text-xs" style={{ color: "var(--text-muted)" }}>
                          Dica: se o teclado não mostrar <b>@</b>, altere para o teclado de e-mail (inputMode).
                        </p>
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
                          className={`input h-12 text-base bg-white ${submitted && !celularOk ? "ring-1 ring-red-500" : ""}`}
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
                          <p className="text-xs md:text-sm mt-1 text-red-600">Informe um celular válido com DDD.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <ChatBubble side="left" title="Senha" tone="neutral">
                    Combine letras maiúsculas, minúsculas e números. Isso protege sua conta.
                  </ChatBubble>

                  <div
                    className="rounded-3xl border p-5 md:p-6 space-y-5 shadow-sm"
                    style={{
                      background: "color-mix(in srgb, var(--surface-elevated) 92%, transparent)",
                      borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="senha" className="label font-medium text-sm md:text-base">
                          Senha <span aria-hidden="true" className="text-red-600">*</span>
                        </label>

                        <div className={`relative ${submitted && !senhaOk ? "ring-1 ring-red-500 rounded-xl" : ""}`}>
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
                            className="input pr-12 h-12 text-xs sm:text-sm md:text-base bg-white"
                            placeholder="Crie uma senha forte"
                            autoComplete="new-password"
                            aria-required="true"
                            aria-invalid={submitted && !senhaOk}
                            aria-describedby="senha-policy"
                          />

                          <button
                            type="button"
                            onClick={() => setShowPass((v) => !v)}
                            className="absolute inset-y-0 right-0 px-3 hover:opacity-80 focus:outline-none text-sm"
                            aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                            aria-pressed={showPass}
                            title={showPass ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showPass ? "🙈" : "👁️"}
                          </button>
                        </div>

                        <div
                          id="senha-policy"
                          className="rounded-2xl px-4 py-3 mt-2 border"
                          style={{
                            background: "color-mix(in srgb, var(--surface) 86%, transparent)",
                            borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                          }}
                          aria-live="polite"
                        >
                          <p className="text-[11px] md:text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                            Requisitos
                          </p>
                          <ul className="space-y-1">
                            <Rule ok={senhaChecks.len}>Pelo menos 8 caracteres</Rule>
                            <Rule ok={senhaChecks.upper}>Ao menos 1 letra maiúscula</Rule>
                            <Rule ok={senhaChecks.lower}>Ao menos 1 letra minúscula</Rule>
                            <Rule ok={senhaChecks.digit}>Ao menos 1 número</Rule>
                          </ul>
                        </div>

                        {submitted && !senhaOk && (
                          <p className="text-xs md:text-sm mt-2 text-red-600">
                            Ajuste a senha conforme os requisitos acima.
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmSenha" className="label font-medium text-sm md:text-base">
                          Confirmar senha <span aria-hidden="true" className="text-red-600">*</span>
                        </label>

                        <div className={`relative ${submitted && !confirmOk ? "ring-1 ring-red-500 rounded-xl" : ""}`}>
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
                            className="input pr-12 h-12 text-xs sm:text-sm md:text-base bg-white"
                            placeholder="Repita a mesma senha"
                            autoComplete="new-password"
                            aria-required="true"
                            aria-invalid={submitted && !confirmOk}
                          />

                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute inset-y-0 right-0 px-3 hover:opacity-80 focus:outline-none text-sm"
                            aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                            aria-pressed={showConfirm}
                            title={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showConfirm ? "🙈" : "👁️"}
                          </button>
                        </div>

                        {submitted && !confirmOk && (
                          <p className="text-xs md:text-sm mt-1 text-red-600">As senhas precisam ser iguais.</p>
                        )}

                        <div className="mt-3 rounded-2xl px-4 py-3 border flex items-start gap-2">
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
                        <button type="button" className="underline hover:opacity-80" onClick={() => focusByField(it.field)}>
                          {it.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom bar: WhatsApp send vibe */}
              <div
                className="sticky bottom-0 pt-2"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--surface) 92%, transparent) 30%, color-mix(in srgb, var(--surface) 96%, transparent) 100%)",
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
                        }, 0);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full h-12 px-6 text-sm md:text-base font-medium border hover:opacity-90"
                      style={{
                        background: "color-mix(in srgb, var(--surface-elevated) 90%, transparent)",
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
                        background: "color-mix(in srgb, var(--surface-elevated) 90%, transparent)",
                        borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                        color: "var(--text)",
                      }}
                    >
                      Já tenho conta
                    </Link>
                  )}
                </div>

                <p className="mt-3 text-[11px] md:text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Seus dados são protegidos e tratados conforme a LGPD.
                </p>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </section>
  );
}
