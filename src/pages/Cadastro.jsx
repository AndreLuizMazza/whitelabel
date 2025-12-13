// src/pages/Cadastro.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import useTenant from "@/store/tenant";
import { celcashCriarClienteContrato, celcashGerarCarneManual } from "@/lib/celcashApi";

import { CheckCircle2, ChevronLeft, Info, Loader2, X } from "lucide-react";

import {
  onlyDigits,
  cpfIsValid,
  formatCPF,
  formatCEP,
  maskCEP,
  formatPhoneBR,
  phoneIsValid,
  sanitizeUF,
  formatDateBR,
  normalizeISODate,
} from "@/lib/br";

import { efetivacaoProxMesPorDiaD, ageFromDate } from "@/lib/dates";
import { useDebouncedCallback } from "@/lib/hooks";
import { useViaCep } from "@/lib/useViaCep";

// Etapas (componentes)
import StepTitularIntro from "./cadastro/StepTitularIntro";
import StepEndereco from "./cadastro/StepEndereco";
import StepDependentes from "./cadastro/StepDependentes";
import StepCarne from "./cadastro/StepCarne";

import { detalharValorMensalidadePlano, gerarCobrancasPlano } from "@/lib/planPricing";

const isEmpty = (v) => !String(v || "").trim();
const AREA_ASSOCIADO_PATH = (import.meta?.env?.VITE_ASSOC_AREA_PATH || "/area").toString();

function moneyBRL(v) {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `R$ ${n.toFixed(2)}`.replace(".", ",");
  }
}

function FieldRead({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--c-muted)]">{label}</p>
      <p className={`mt-0.5 font-medium ${mono ? "tabular-nums" : ""} break-words text-[13px]`}>
        {value || "—"}
      </p>
    </div>
  );
}

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm md:text-base font-semibold tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function decodePayloadParam(p) {
  if (!p) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(p)));
  } catch {
    try {
      return JSON.parse(atob(p));
    } catch {
      try {
        return JSON.parse(decodeURIComponent(p));
      } catch {
        return null;
      }
    }
  }
}

function encodePayloadParam(obj) {
  try {
    const json = JSON.stringify(obj || {});
    return btoa(encodeURIComponent(json));
  } catch {
    try {
      return btoa(JSON.stringify(obj || {}));
    } catch {
      return "";
    }
  }
}

/**
 * Camada de “ambiente” premium (halo) para dar consistência visual com Login
 * sem alterar a estrutura dos Steps.
 */
function StepAmbient({ children }) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[60px] mx-auto h-36 max-w-2xl rounded-[48px] opacity-70"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/* -------------------- Modal (sem dependência) -------------------- */
function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document?.body?.style?.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (ev) => {
      if (ev.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow || "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-6 mx-auto w-[92vw] max-w-3xl">
        <div
          className="rounded-[28px] border shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
          style={{
            background: "color-mix(in srgb, var(--c-surface) 88%, transparent)",
            borderColor: "color-mix(in srgb, var(--c-border) 70%, transparent)",
            backdropFilter: "blur(18px)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--c-border)]/60">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--c-muted)]">Seleção</p>
              <h3 className="text-base md:text-lg font-semibold tracking-tight truncate">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/80 hover:bg-[var(--c-surface)] transition"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* conteúdo rolável (evita “estourar” em telas menores) */}
          <div className="px-5 py-5 max-h-[75vh] overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cadastro() {
  const q = useQuery();
  const location = useLocation();
  const navigate = useNavigate();
  const empresa = useTenant((s) => s.empresa);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Etapas:
  // 1 - Titular + dados complementares
  // 2 - Endereço
  // 3 - Dependentes (pode ser ocultada se plano for "individual")
  // 4 - Cobrança (final)
  const [currentStep, setCurrentStep] = useState(1);

  const [stepAttempted, setStepAttempted] = useState({
    complementares: false,
    endereco: false,
    dependentes: false,
  });

  const alertRef = useRef(null);

  // âncora real de conteúdo (para rolagem inteligente no mobile)
  const contentAnchorRef = useRef(null);
  const [pendingScroll, setPendingScroll] = useState(false);

  const sexoRef = useRef(null);
  const ecRef = useRef(null);
  const cepRef = useRef(null);
  const logRef = useRef(null);
  const numRef = useRef(null);
  const bairroRef = useRef(null);
  const cidadeRef = useRef(null);
  const ufRef = useRef(null);

  const payload = useMemo(() => decodePayloadParam(q.get("p")), [q]);

  // --- Agora o plano pode ser trocado a qualquer momento ---
  const [planoIdState, setPlanoIdState] = useState(payload?.plano || null);
  const cupom = payload?.cupom || "";

  // plano completo: começa com snapshot (se vier) e enriquece com GET /planos/{id}
  const [plano, setPlano] = useState(payload?.planSnapshot || null);

  // --- Seleção de planos (modal) ---
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  const [planListState, setPlanListState] = useState({ loading: false, items: [], error: "" });

  function applySelectedPlano(nextPlano) {
    const nextId = nextPlano?.id ?? nextPlano?.planoId ?? null;
    if (!nextId) return;

    // Mantém cupom e o que já veio no payload, mas troca plano
    const nextPayload = {
      ...(payload || {}),
      plano: Number(nextId),
      planSnapshot: nextPlano || null,
      cupom: cupom || (payload?.cupom || ""),
    };

    setPlanoIdState(Number(nextId));
    setPlano(nextPlano || null);

    const encoded = encodePayloadParam(nextPayload);
    const nextUrl = encoded ? `${location.pathname}?p=${encodeURIComponent(encoded)}` : location.pathname;
    navigate(nextUrl, { replace: true });

    // ao trocar plano, o usuário não deve “perder” a etapa atual
    setPlanModalOpen(false);
    setError("");
  }

  useEffect(() => {
    if (!planModalOpen) return;

    let alive = true;
    (async () => {
      try {
        setPlanListState((s) => ({ ...s, loading: true, error: "" }));
        // endpoint esperado: lista de planos disponíveis
        const resp = await api.get(`/api/v1/planos`);
        if (!alive) return;

        const data = resp?.data;
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setPlanListState({ loading: false, items, error: "" });
      } catch (e) {
        if (!alive) return;
        setPlanListState({
          loading: false,
          items: [],
          error: e?.response?.data?.message || e?.message || "Não foi possível carregar os planos agora.",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [planModalOpen]);

  useEffect(() => {
    // NÃO exibir CTA de contato nesta tela:
    const id = "cadastro-hide-contact-cta";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      /* Esconde CTA/Dock de contato apenas nesta rota */
      .sticky-contact-dock,
      #sticky-contact-dock,
      [data-sticky-contact-dock],
      [data-contact-dock],
      [data-contact-cta],
      .ContactDock,
      .StickyContactDock,
      .contact-dock,
      .whatsapp-cta,
      .cta-contato {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      body { padding-bottom: 0px !important; }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    if (!planoIdState) return;

    let alive = true;
    (async () => {
      try {
        const resp = await api.get(`/api/v1/planos/${planoIdState}`);
        if (!alive) return;
        const planoApi = resp?.data || {};
        setPlano((prev) => ({
          ...(prev || {}),
          ...planoApi,
        }));
      } catch (e) {
        console.error("[Cadastro] Falha ao buscar plano por ID", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [planoIdState]);

  const UF_PADRAO = (import.meta?.env?.VITE_UF_PADRAO || window.__UF_PADRAO__ || "")
    .toString()
    .toUpperCase()
    .slice(0, 2);

  const defaultTitular = {
    id: null,
    nome: "",
    cpf: "",
    rg: "",
    estado_civil: "",
    sexo: "",
    data_nascimento: "",
    celular: "",
    email: "",
    endereco: {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
    },
  };

  const [titular, setTitular] = useState(defaultTitular);
  const [depsExistentes, setDepsExistentes] = useState([]);
  const [depsNovos, setDepsNovos] = useState([]);
  const [diaDSelecionado, setDiaDSelecionado] = useState(10);

  const [lookupState, setLookupState] = useState({
    running: false,
    pessoaEncontrada: null,
    temContratoAtivo: false,
    contratosResumo: [],
    mensagem: "",
    erro: "",
  });

  async function tryGet(apiCall) {
    try {
      const r = await apiCall();
      return r?.data ?? null;
    } catch {
      return null;
    }
  }

  async function buscarPessoaPorCPF(cpfMasked) {
    let data = await tryGet(() => api.get(`/api/v1/pessoas/cpf/${cpfMasked}`));
    if (data && (data.id || data.pessoaId)) return data;

    data = await tryGet(() => api.get(`/api/v1/pessoas/by-cpf/${onlyDigits(cpfMasked)}`));
    if (data && (data.id || data.pessoaId)) return data;

    data = await tryGet(() => api.get(`/api/v1/pessoas`, { params: { cpf: onlyDigits(cpfMasked) } }));
    if (Array.isArray(data) && data.length) return data[0];
    if (data && (data.id || data.pessoaId)) return data;

    return null;
  }

  function normalizePessoaToTitular(p) {
    const endereco =
      p?.endereco || p?.address || p?.logradouro
        ? {
            cep: p?.endereco?.cep || p?.cep || "",
            logradouro: p?.endereco?.logradouro || p?.logradouro || "",
            numero: p?.endereco?.numero || p?.numero || "",
            complemento: p?.endereco?.complemento || p?.complemento || "",
            bairro: p?.endereco?.bairro || p?.bairro || "",
            cidade: p?.endereco?.cidade || p?.cidade || "",
            uf: (p?.endereco?.uf || p?.uf || "").toUpperCase().slice(0, 2),
          }
        : {
            cep: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            uf: "",
          };

    const contatos = p?.contatos || {};
    const celular = contatos?.celular || p?.celular || "";
    const email = contatos?.email || p?.email || "";

    const sexoNorm = p?.sexo === "MULHER" ? "MULHER" : p?.sexo === "HOMEM" ? "HOMEM" : "";
    const ecNorm = p?.estadoCivil || "";

    return {
      id: p?.id || p?.pessoaId || null,
      nome: p?.nome || "",
      cpf: p?.cpf || "",
      rg: p?.rg || "",
      estado_civil: ecNorm,
      sexo: sexoNorm,
      data_nascimento: normalizeISODate(p?.dataNascimento || ""),
      celular,
      email,
      endereco,
    };
  }

  async function buscarDependentesPorPessoaId(pessoaId) {
    if (!pessoaId) return [];
    const data = await tryGet(() => api.get(`/api/v1/dependentes/pessoa/${encodeURIComponent(pessoaId)}`));
    if (!Array.isArray(data)) return [];
    return data;
  }

  async function buscarContratosDaPessoaPorCPF(cpfMasked) {
    const data = await tryGet(() => api.get(`/api/v1/contratos/cpf/${cpfMasked}`));
    if (Array.isArray(data)) return data;
    if (data?.contratos && Array.isArray(data.contratos)) return data.contratos;
    return [];
  }

  function contratoAtivoPredicate(c) {
    const status = (c?.status || c?.contratoAtivo || c?.ativo || "").toString().toUpperCase();
    if (status === "ATIVO" || status === "TRUE" || status === "1") return true;
    if (typeof c?.contratoAtivo === "boolean") return c.contratoAtivo;
    if (typeof c?.ativo === "boolean") return c.ativo;
    return true;
  }

  async function runLookupByCpf(cpfMasked, { prefillFromPessoa = true, suppressNoCadastroMessage = false } = {}) {
    const cpfFmt = formatCPF(cpfMasked || "");
    if (!cpfIsValid(cpfFmt)) {
      setLookupState({
        running: false,
        pessoaEncontrada: null,
        temContratoAtivo: false,
        contratosResumo: [],
        mensagem: "",
        erro: "",
      });
      return;
    }
    setLookupState({
      running: true,
      pessoaEncontrada: null,
      temContratoAtivo: false,
      contratosResumo: [],
      mensagem: "",
      erro: "",
    });
    try {
      const pessoaRaw = await buscarPessoaPorCPF(cpfFmt);

      if (pessoaRaw && prefillFromPessoa) {
        const pessoaNorm = normalizePessoaToTitular(pessoaRaw);
        setTitular((prev) => ({
          ...prev,
          ...pessoaNorm,
          cpf: pessoaNorm.cpf || cpfFmt,
        }));

        const deps = await buscarDependentesPorPessoaId(pessoaNorm.id);
        setDepsExistentes(
          deps.map((d) => ({
            id: d.id,
            nome: d.nome,
            cpf: d.cpf || "",
            sexo: d.sexo || "",
            parentesco: d.parentesco || "",
            data_nascimento: normalizeISODate(d.dataNascimento || ""),
          }))
        );
      } else {
        setTitular((prev) => ({ ...prev, id: null, cpf: cpfFmt }));
        setDepsExistentes([]);
      }

      const contratos = await buscarContratosDaPessoaPorCPF(cpfFmt);
      const ativos = contratos.filter(contratoAtivoPredicate);

      const temPessoa = Boolean(pessoaRaw);

      setLookupState({
        running: false,
        pessoaEncontrada: temPessoa ? normalizePessoaToTitular(pessoaRaw) : null,
        temContratoAtivo: ativos.length > 0,
        contratosResumo: contratos,
        mensagem: temPessoa ? (ativos.length > 0 ? "Encontramos um contrato ativo neste CPF." : "") : suppressNoCadastroMessage ? "" : "",
        erro: "",
      });
    } catch (e) {
      setLookupState({
        running: false,
        pessoaEncontrada: null,
        temContratoAtivo: false,
        contratosResumo: [],
        mensagem: "",
        erro: e?.response?.data?.message || e?.message || "Falha ao verificar CPF agora.",
      });
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.get("/api/v1/app/me").then((r) => r?.data).catch(() => null);
        if (!alive || !me) return;

        const cpfFromMe = me?.cpf || "";
        setTitular((prev) => ({
          ...prev,
          cpf: prev?.cpf || cpfFromMe || "",
          nome: prev?.nome || me?.nome || "",
          email: prev?.email || me?.email || "",
          celular: prev?.celular || me?.celular || "",
          data_nascimento: prev?.data_nascimento || normalizeISODate(me?.dataNascimento || ""),
        }));

        if (cpfIsValid(cpfFromMe)) {
          await runLookupByCpf(cpfFromMe, { prefillFromPessoa: true, suppressNoCadastroMessage: true });
        }
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  const [addressTouched, setAddressTouched] = useState({
    logradouro: false,
    bairro: false,
    cidade: false,
    uf: false,
  });
  const setAddrTouched = (patch) => setAddressTouched((prev) => ({ ...prev, ...patch }));

  const { state: cepState, fetchCEP, setState: setCepState } = useViaCep({ ufPadrao: UF_PADRAO });

  const applyViaCepData = (data) => {
    setTitular((t) => ({
      ...t,
      endereco: {
        ...t.endereco,
        logradouro: addressTouched.logradouro ? t.endereco.logradouro : data.logradouro || t.endereco.logradouro,
        bairro: addressTouched.bairro ? t.endereco.bairro : data.bairro || t.endereco.bairro,
        cidade: addressTouched.cidade ? t.endereco.cidade : data.localidade || t.endereco.cidade,
        uf: addressTouched.uf ? sanitizeUF(t.endereco.uf) : sanitizeUF(data.uf || t.endereco.uf || UF_PADRAO || ""),
      },
    }));
  };

  const debouncedBuscaCEP = useDebouncedCallback((cepRaw) => {
    fetchCEP(cepRaw, applyViaCepData);
  }, 500);

  const valorAdesaoPlano = Number(plano?.valorAdesao ?? plano?.valor_adesao ?? 0);
  const dataEfetivacaoISO = efetivacaoProxMesPorDiaD(diaDSelecionado);

  const idadeMinDep = Number.isFinite(plano?.idadeMinimaDependente) ? Number(plano.idadeMinimaDependente) : undefined;
  const idadeMaxDep = Number.isFinite(plano?.idadeMaximaDependente) ? Number(plano.idadeMaximaDependente) : undefined;

  const depsIssuesNovos = depsNovos.map((d) => {
    const age = ageFromDate(d.data_nascimento);
    const fora =
      d.data_nascimento &&
      ((Number.isFinite(idadeMinDep) && age < idadeMinDep) || (Number.isFinite(idadeMaxDep) && age > idadeMaxDep));
    const parentescoVazio = Boolean((d.nome || "").trim()) && !d.parentesco;
    const cpfInvalido = Boolean((d.cpf || "").trim()) && !cpfIsValid(d.cpf);
    return { fora, age, parentescoVazio, cpfInvalido };
  });
  const countDepsFora = depsIssuesNovos.filter((x) => x.fora).length;

  const updTit = (patch) => setTitular((t) => ({ ...t, ...patch }));
  const updTitEndereco = (patch) => setTitular((t) => ({ ...t, endereco: { ...t.endereco, ...patch } }));

  const updDepNovo = (i, patch) => setDepsNovos((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDepNovo = (initial = {}) =>
    setDepsNovos((prev) => [...prev, { nome: "", cpf: "", sexo: "", parentesco: "", data_nascimento: "", ...initial }]);
  const delDepNovo = (i) => setDepsNovos((prev) => prev.filter((_, idx) => idx !== i));

  const e = titular.endereco || {};
  const cepDigits = onlyDigits(e.cep || "");
  const ufClean = (e.uf || "").toUpperCase().slice(0, 2);

  // === Regra: se o nome do plano tiver "individual", oculta etapa de dependentes ===
  const isPlanoIndividual = useMemo(() => {
    const nome = String(plano?.nome || "").toLowerCase();
    return nome.includes("individual");
  }, [plano?.nome]);

  // Se estiver na etapa 3 e o plano virar "individual", pula para Cobranças
  useEffect(() => {
    if (isPlanoIndividual && currentStep === 3) {
      goToStep(4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlanoIndividual]);

  function buildErrorList() {
    const items = [];

    if (!(titular.nome && titular.nome.trim().length >= 3)) items.push({ field: "fixo", label: "Titular: nome ausente." });
    if (!cpfIsValid(titular.cpf)) items.push({ field: "fixo", label: "Titular: CPF inválido ou ausente." });
    if (!titular.data_nascimento) items.push({ field: "fixo", label: "Titular: data de nascimento ausente." });
    if (!phoneIsValid(titular.celular)) items.push({ field: "fixo", label: "Titular: celular ausente ou inválido." });

    if (!titular.sexo) items.push({ field: "sexo", label: "Titular: selecione o sexo." });
    if (!titular.estado_civil) items.push({ field: "estado_civil", label: "Titular: selecione o estado civil." });

    if (!(cepDigits.length === 8)) items.push({ field: "cep", label: "Endereço: CEP deve ter 8 dígitos." });
    if (!e.logradouro?.trim()) items.push({ field: "logradouro", label: "Endereço: informe o logradouro." });
    if (!e.numero?.trim()) items.push({ field: "numero", label: "Endereço: informe o número." });
    if (!e.bairro?.trim()) items.push({ field: "bairro", label: "Endereço: informe o bairro." });
    if (!e.cidade?.trim()) items.push({ field: "cidade", label: "Endereço: informe a cidade." });
    if (!(ufClean && ufClean.length === 2)) items.push({ field: "uf", label: "Endereço: informe a UF (2 letras)." });
    if (cepState.error) items.push({ field: "cep", label: `Endereço: ${cepState.error}` });

    // Dependentes só entram na validação final se a etapa existir
    if (!isPlanoIndividual) {
      depsNovos.forEach((d, i) => {
        const issue = depsIssuesNovos[i];
        if (!((d.nome || "").trim().length >= 3))
          items.push({ field: `depN-${i}-nome`, label: `Dependente novo ${i + 1}: informe o nome (mín. 3 caracteres).` });
        if (!d.parentesco)
          items.push({ field: `depN-${i}-parentesco`, label: `Dependente novo ${i + 1}: selecione o parentesco.` });
        if (!d.sexo) items.push({ field: `depN-${i}-sexo`, label: `Dependente novo ${i + 1}: selecione o sexo.` });
        if (!d.data_nascimento) {
          items.push({ field: `depN-${i}-nasc`, label: `Dependente novo ${i + 1}: informe a data de nascimento.` });
        } else if (issue?.fora) {
          items.push({ field: `depN-${i}-nasc`, label: `Dependente novo ${i + 1}: data fora do limite etário do plano.` });
        }
        if (d.cpf && issue?.cpfInvalido) items.push({ field: `depN-${i}-cpf`, label: `Dependente novo ${i + 1}: CPF inválido.` });
      });
    }

    return items;
  }

  function focusByField(field) {
    const map = {
      sexo: sexoRef,
      estado_civil: ecRef,
      cep: cepRef,
      logradouro: logRef,
      numero: numRef,
      bairro: bairroRef,
      cidade: cidadeRef,
      uf: ufRef,
    };
    if (map[field]?.current) {
      map[field].current.focus();
      return;
    }
    if (field?.startsWith?.("depN-")) {
      const el = document.getElementById(field);
      if (el) el.focus();
    }
  }

  function validateDadosComplementares() {
    const okEstadoCivil = !isEmpty(titular.estado_civil);
    const okSexo = !isEmpty(titular.sexo);
    if (!okEstadoCivil) {
      focusByField("estado_civil");
      return false;
    }
    if (!okSexo) {
      focusByField("sexo");
      return false;
    }
    return true;
  }

  function validateEndereco() {
    const addr = titular.endereco || {};
    const errors = [];
    const _cepDigits = onlyDigits(addr.cep || "");
    if (!(_cepDigits.length === 8) || cepState.error) errors.push("cep");
    if (!addr.logradouro?.trim()) errors.push("logradouro");
    if (!addr.numero?.trim()) errors.push("numero");
    if (!addr.bairro?.trim()) errors.push("bairro");
    if (!addr.cidade?.trim()) errors.push("cidade");
    const uf = (addr.uf || "").toUpperCase().slice(0, 2);
    if (!(uf && uf.length === 2)) errors.push("uf");
    if (errors.length > 0) {
      focusByField(errors[0]);
      return false;
    }
    return true;
  }

  function validateDependentes() {
    if (isPlanoIndividual) return true;
    if (!depsNovos.length) return true;
    const localErrors = [];
    depsNovos.forEach((d, i) => {
      const issue = depsIssuesNovos[i];
      if (!((d.nome || "").trim().length >= 3)) localErrors.push(`depN-${i}-nome`);
      if (!d.parentesco) localErrors.push(`depN-${i}-parentesco`);
      if (!d.sexo) localErrors.push(`depN-${i}-sexo`);
      if (!d.data_nascimento || issue?.fora) localErrors.push(`depN-${i}-nasc`);
      if (d.cpf && issue?.cpfInvalido) localErrors.push(`depN-${i}-cpf`);
    });
    if (localErrors.length > 0) {
      focusByField(localErrors[0]);
      return false;
    }
    return true;
  }

  const [errorList, setErrorList] = useState([]);
  useEffect(() => {
    if (submitAttempted && errorList.length > 0) {
      setTimeout(() => {
        alertRef.current?.focus();
        focusByField(errorList[0].field);
      }, 0);
    }
  }, [submitAttempted, errorList]);

  const debouncedCpfLookup = useDebouncedCallback(async (cpfMasked) => {
    await runLookupByCpf(cpfMasked, { prefillFromPessoa: true });
  }, 600);

  useEffect(() => {
    if (!titular?.cpf) return;
    debouncedCpfLookup(titular.cpf);
  }, [titular?.cpf]);

  // === CÁLCULO DETALHADO DA MENSALIDADE ===
  const composicaoMensalidade = useMemo(() => {
    if (!plano) return null;
    return detalharValorMensalidadePlano(plano, titular, depsExistentes, depsNovos);
  }, [plano, titular, depsExistentes, depsNovos]);

  const valorMensalidadePlano = composicaoMensalidade?.total ?? 0;

  const planoResumo = useMemo(() => {
    const p = plano || {};
    const carenciaNum = Number(p?.periodoCarencia ?? p?.carencia ?? p?.carenciaEmDias ?? 0) || 0;
    const carenciaUn = (p?.unidadeCarencia || p?.unidade_carencia || "DIAS").toString().toUpperCase();
    const carenciaTxt =
      carenciaNum > 0 ? `${carenciaNum} ${carenciaUn === "MES" || carenciaUn === "MESES" ? "meses" : "dias"}` : "Sem carência";

    const depMax = Number.isFinite(p?.numeroDependentes) ? Number(p.numeroDependentes) : null;
    const depTxt = depMax === null ? "—" : depMax === 0 ? "Apenas titular" : `Até ${depMax} dependente(s)`;

    const idadeMin = Number.isFinite(p?.idadeMinimaDependente) ? Number(p.idadeMinimaDependente) : null;
    const idadeMax = Number.isFinite(p?.idadeMaximaDependente) ? Number(p.idadeMaximaDependente) : null;
    const idadeTxt = idadeMin === null && idadeMax === null ? "—" : `${idadeMin ?? 0} a ${idadeMax ?? 100}`;

    const formas = [];
    if (p?.pagamentoPix) formas.push("Pix");
    if (p?.pagamentoBoleto) formas.push("Boleto");
    if (p?.pagamentoCartao) formas.push("Cartão");
    const formasTxt = formas.length ? formas.join(" • ") : "—";

    const telTxt = p?.telemedicina === true ? "Inclusa" : p?.telemedicina === false ? "Não inclusa" : "—";

    return { carenciaTxt, depTxt, idadeTxt, formasTxt, telTxt };
  }, [plano]);

  async function handleSalvarEnviar() {
    setSubmitAttempted(true);
    setError("");
    const list = buildErrorList();
    setErrorList(list);
    if (list.length > 0) return;

    setSaving(true);
    try {
      const addr = titular.endereco || {};
      const payloadPessoa = {
        nome: (titular.nome || "").trim(),
        cpf: formatCPF(titular.cpf || ""),
        rg: titular.rg || null,
        dataNascimento: titular.data_nascimento || null,
        sexo: titular.sexo === "MULHER" ? "MULHER" : titular.sexo === "HOMEM" ? "HOMEM" : null,
        estadoCivil: titular.estado_civil || null,
        contatos: {
          email: titular.email || null,
          celular: titular.celular ? onlyDigits(titular.celular) : null,
          telefone: null,
        },
        endereco: {
          cep: addr.cep ? onlyDigits(addr.cep) : null,
          cidade: addr.cidade || null,
          uf: (addr.uf || "").toUpperCase().slice(0, 2) || null,
          bairro: addr.bairro || null,
          logradouro: addr.logradouro || null,
          numero: addr.numero || null,
          complemento: addr.complemento || null,
        },
      };

      let titularId = titular?.id || lookupState?.pessoaEncontrada?.id || lookupState?.pessoaEncontrada?.pessoaId || null;

      if (!titularId) {
        const pessoaRes = await api.post("/api/v1/pessoas", payloadPessoa);
        titularId = pessoaRes?.data?.id || pessoaRes?.data?.pessoaId || pessoaRes?.data?.uuid;
        if (!titularId) throw new Error("Não foi possível obter o ID do titular (etapa pessoa).");
      }

      // Dependentes: só cria se a etapa existir
      if (!isPlanoIndividual && depsNovos.length > 0) {
        const depsToCreate = depsNovos.map((d) => ({
          cpf: d.cpf ? onlyDigits(d.cpf) : null,
          nome: (d.nome || "").trim(),
          email: null,
          fone: null,
          celular: null,
          parentesco: d.parentesco || null,
          sexo: d.sexo === "MULHER" ? "MULHER" : d.sexo === "HOMEM" ? "HOMEM" : null,
          dataNascimento: d.data_nascimento || null,
          titularId: titularId,
          apelido: null,
          estadoCivil: null,
        }));
        for (const depPayload of depsToCreate) {
          await api.post("/api/v1/dependentes", depPayload);
        }
      }

      const todayISO = new Date().toISOString().slice(0, 10);
      const payloadContrato = {
        titularId: Number(titularId),
        planoId: Number(planoIdState),
        vendedorId: 717,
        dataContrato: todayISO,
        diaD: Number(diaDSelecionado),
        valorAdesao: Number(valorAdesaoPlano || 0),
        valorMensalidade: Number(valorMensalidadePlano || 0),
        dataEfetivacao: dataEfetivacaoISO,
        cupomDesconto: cupom || null,
      };

      const contratoRes = await api.post("/api/v1/contratos", payloadContrato);
      const contratoId = contratoRes?.data?.id || contratoRes?.data?.contratoId || contratoRes?.data?.uuid;
      if (!contratoId) throw new Error("Não foi possível obter o ID do contrato recém-criado.");

      try {
        await celcashCriarClienteContrato(contratoId, {});
      } catch (err) {
        console.error("[Cadastro] Falha ao criar cliente/contrato na CelCash", err);
      }

      try {
        const todayISOForPreview = new Date().toISOString().slice(0, 10);
        const mensalidades = gerarCobrancasPlano(plano, dataEfetivacaoISO, valorMensalidadePlano);
        const cobrancasForCelCash = [];

        if (valorAdesaoPlano > 0) {
          cobrancasForCelCash.push({
            numeroParcela: 1,
            valor: valorAdesaoPlano,
            dataVencimento: todayISOForPreview,
          });
        }

        mensalidades.forEach((cob) => {
          cobrancasForCelCash.push({
            numeroParcela: cobrancasForCelCash.length + 1,
            valor: Number(cob.valor || 0),
            dataVencimento: cob.dataVencimentoISO,
          });
        });

        if (cobrancasForCelCash.length > 0) {
          const carnePayload = { mainPaymentMethodId: "boleto", cobrancas: cobrancasForCelCash };
          await celcashGerarCarneManual(contratoId, carnePayload);
        }
      } catch (err) {
        console.error("[Cadastro] Falha ao gerar carnê manual na CelCash", err);
        setError(
          "Seu contrato foi criado, mas não conseguimos gerar o carnê automático agora. " +
            "A empresa será avisada para concluir essa etapa manualmente."
        );
      }

      navigate(`/confirmacao?contrato=${contratoId || ""}&titular=${titularId}`);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === "string" ? e.response.data : "") ||
        e?.message ||
        "";
      setError(
        msg
          ? `Não conseguimos concluir o envio: ${msg}`
          : "Não conseguimos concluir o envio pelo site. Por favor, entre em contato com a empresa."
      );
    } finally {
      setSaving(false);
    }
  }

  const bloquearCadastro = lookupState.temContratoAtivo === true;

  const glassCardStyle = {
    background: "color-mix(in srgb, var(--c-surface) 84%, transparent)",
    borderColor: "color-mix(in srgb, var(--c-border) 70%, transparent)",
    boxShadow: "0 22px 70px rgba(15,23,42,0.35)",
    backdropFilter: "blur(18px)",
  };

  // Steps visíveis (remove Dependentes se plano for "individual")
  const stepsAll = useMemo(
    () => [
      { id: 1, label: "Titular" },
      { id: 2, label: "Endereço" },
      { id: 3, label: "Dependentes" },
      { id: 4, label: "Cobranças" },
    ],
    []
  );

  const visibleSteps = useMemo(() => {
    if (isPlanoIndividual) return stepsAll.filter((s) => s.id !== 3);
    return stepsAll;
  }, [stepsAll, isPlanoIndividual]);

  const currentIndex = Math.max(0, visibleSteps.findIndex((s) => s.id === currentStep));
  const totalSteps = visibleSteps.length || 1;

  const todayISO = new Date().toISOString().slice(0, 10);

  const cobrancasPreview = useMemo(() => {
    if (!dataEfetivacaoISO || !plano) return [];
    const lista = [];
    if (valorAdesaoPlano > 0) {
      lista.push({ id: "adesao", tipo: "Taxa de adesão", valor: valorAdesaoPlano, dataVencimentoISO: todayISO });
    }
    const mensalidades = gerarCobrancasPlano(plano, dataEfetivacaoISO, valorMensalidadePlano);
    mensalidades.forEach((cob) => {
      lista.push({
        id: `mensal-${cob.numeroParcela}`,
        tipo: `${cob.numeroParcela}ª mensalidade`,
        valor: cob.valor,
        dataVencimentoISO: cob.dataVencimentoISO,
      });
    });
    return lista;
  }, [plano, valorAdesaoPlano, valorMensalidadePlano, dataEfetivacaoISO, todayISO]);

  // Mapeia um "próximo step" pedido pelos componentes para o step real quando Dependentes é ocultado
  const mapStep = (requestedStep) => {
    const s = Number(requestedStep);
    if (isPlanoIndividual && s === 3) return 4;
    return s;
  };

  const goToStep = (step) => {
    const next = mapStep(step);
    setCurrentStep(next);
    setPendingScroll(true);
  };

  // Rolagem inteligente (mais estável no mobile): respeita reduced motion
  useEffect(() => {
    if (!pendingScroll) return;

    const el = contentAnchorRef.current;
    if (!el) {
      setPendingScroll(false);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const behavior = prefersReduced ? "auto" : "smooth";

    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          el.scrollIntoView({ behavior, block: "start" });
        } catch {
          const rect = el.getBoundingClientRect();
          const top = window.scrollY + rect.top - 88;
          window.scrollTo({ top: Math.max(0, top), behavior });
        } finally {
          setPendingScroll(false);
        }
      });
    });

    return () => cancelAnimationFrame(raf1);
  }, [pendingScroll, currentStep]);

  // Para “grudar” o stepper no topo quando rolar:
  const stickyTop = "calc(var(--app-header-h, 72px) + 10px)";

  // filtro simples na lista de planos
  const planosFiltrados = useMemo(() => {
    const term = (planSearch || "").trim().toLowerCase();
    const arr = planListState.items || [];
    if (!term) return arr;
    return arr.filter((p) => {
      const nome = String(p?.nome || "").toLowerCase();
      const id = String(p?.id ?? "");
      return nome.includes(term) || id.includes(term);
    });
  }, [planSearch, planListState.items]);

  const onBackFromCarne = () => {
    // Volta para a etapa anterior visível
    const idx = visibleSteps.findIndex((s) => s.id === currentStep);
    const prev = idx > 0 ? visibleSteps[idx - 1]?.id : 1;
    goToStep(prev || 1);
  };

  return (
    <section className="section">
      <div className="container-max max-w-4xl md:max-w-5xl">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/90 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md hover:bg-[var(--c-surface)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Voltar para a página anterior"
          >
            <ChevronLeft size={16} /> Voltar
          </button>
        </div>

        {currentStep === 1 && (
          <header className="mb-4">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Cadastre-se em poucos passos</h1>
            <p className="mt-1 text-sm md:text-base leading-relaxed text-[var(--c-muted)]">
              Informe seus dados e escolha a forma de cobrança.
            </p>
          </header>
        )}

        {(lookupState.running || lookupState.mensagem || lookupState.erro) && (
          <div
            className="mb-5 rounded-3xl border px-4 py-4 backdrop-blur-xl"
            style={{
              background: "color-mix(in srgb, var(--c-surface) 82%, transparent)",
              borderColor: "color-mix(in srgb, var(--primary) 35%, transparent)",
              boxShadow: "0 20px 70px rgba(15,23,42,0.4)",
            }}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className="rounded-full p-2 text-white"
                style={{ background: "color-mix(in srgb, var(--primary) 90%, black)" }}
              >
                {lookupState.running ? <Loader2 className="animate-spin" size={16} /> : <Info size={16} />}
              </div>
              <div className="flex-1 space-y-1">
                {lookupState.running && <p className="text-sm">Verificando CPF e contratos…</p>}
                {!lookupState.running && lookupState.mensagem && <p className="text-sm font-medium">{lookupState.mensagem}</p>}
                {!lookupState.running && lookupState.erro && (
                  <p className="text-sm text-red-700">Falha na verificação automática: {lookupState.erro}</p>
                )}
                {!lookupState.running && lookupState.temContratoAtivo && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <CTAButton onClick={() => navigate(AREA_ASSOCIADO_PATH)} className="h-10">
                      Ir para a Área do Associado
                    </CTAButton>
                    <span className="text-xs text-[var(--c-muted)]">
                      Há um contrato ativo neste CPF. Para segurança, o novo cadastro foi bloqueado.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            ref={alertRef}
            role="alert"
            tabIndex={-1}
            className="mb-4 rounded-3xl px-4 py-3 text-sm backdrop-blur-xl"
            style={{
              border: "1px solid color-mix(in srgb, var(--primary) 38%, transparent)",
              background: "color-mix(in srgb, var(--c-surface) 80%, transparent)",
              boxShadow: "0 18px 60px rgba(15,23,42,0.45)",
              color: "var(--text)",
            }}
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {/* Cabeçalho + resumo compacto do titular */}
        <div className="rounded-3xl p-5 md:p-6 space-y-4" style={glassCardStyle}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base md:text-lg font-semibold tracking-tight">Dados para contratação</h2>

              <div className="flex items-center gap-2">
                {plano?.nome ? (
                  <span className="inline-flex items-center rounded-full border border-[var(--c-border)] px-3 py-1 text-[11px] md:text-xs text-[var(--c-muted)] bg-[var(--c-surface)]/80">
                    Plano&nbsp;<span className="font-semibold text-[var(--text)]">{plano.nome}</span>
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => setPlanModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/90 px-3 py-1 text-[11px] md:text-xs font-semibold hover:bg-[var(--c-surface)] transition"
                  aria-label="Trocar plano"
                >
                  Trocar plano
                </button>
              </div>
            </div>

            <p className="text-xs md:text-sm text-[var(--c-muted)]">Revise o titular e confirme as condições do plano antes de avançar.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-7">
            <div className="md:col-span-2">
              <details className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)]/55 p-4 md:p-5">
                <summary className="cursor-pointer list-none">
                  <SectionTitle
                    right={
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)] group-open:opacity-60">
                        Ver detalhes
                      </span>
                    }
                  >
                    Titular
                  </SectionTitle>

                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                      <span className="inline-flex items-center rounded-full bg-[var(--c-surface)]/90 border border-[var(--c-border)] px-3 py-1 max-w-full">
                        <span className="font-medium truncate">{titular.nome || "Nome não informado"}</span>
                      </span>
                      <span className="inline-flex items-center rounded-full bg-[var(--c-surface)]/90 border border-[var(--c-border)] px-3 py-1">
                        {formatCPF(titular.cpf || "") || "CPF não informado"}
                      </span>
                      {titular.celular && (
                        <span className="inline-flex items-center rounded-full bg-[var(--c-surface)]/90 border border-[var(--c-border)] px-3 py-1">
                          {formatPhoneBR(titular.celular)}
                        </span>
                      )}
                    </div>
                  </div>
                </summary>

                <div className="mt-4 grid gap-2 grid-cols-2">
                  <FieldRead label="Nascimento" value={formatDateBR(titular.data_nascimento) || "—"} mono />
                  <div className="col-span-2">
                    <FieldRead label="E-mail" value={titular.email || "—"} />
                  </div>
                </div>
              </details>
            </div>

            <div className="md:col-span-5">
              <details className="group rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)]/55 p-4 md:p-5">
                <summary className="cursor-pointer list-none">
                  <SectionTitle
                    right={
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)] group-open:opacity-60">
                        Ver detalhes
                      </span>
                    }
                  >
                    Plano
                  </SectionTitle>

                  <div className="mt-3 grid gap-2 grid-cols-2">
                    <FieldRead label="Mensalidade estimada" value={moneyBRL(valorMensalidadePlano)} mono />
                    <FieldRead label="Taxa de adesão" value={moneyBRL(valorAdesaoPlano)} mono />
                    <div className="col-span-2">
                      <FieldRead label="Pagamento" value={planoResumo?.formasTxt || "—"} />
                    </div>
                  </div>
                </summary>

                <div className="mt-4 grid gap-2 grid-cols-2">
                  <FieldRead label="Carência" value={planoResumo?.carenciaTxt || "—"} />
                  <FieldRead label="Dependentes" value={planoResumo?.depTxt || "—"} />
                  <div className="col-span-2">
                    <FieldRead label="Idade (dependentes)" value={planoResumo?.idadeTxt || "—"} />
                  </div>
                </div>

                {cupom ? (
                  <div className="mt-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/70 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--c-muted)]">Cupom</p>
                    <p className="mt-0.5 text-sm font-semibold break-words">{cupom}</p>
                  </div>
                ) : null}
              </details>
            </div>
          </div>
        </div>

        {/* Stepper (gruda no topo ao rolar) */}
        <div className="mt-4 mb-5 sticky z-[35]" style={{ top: stickyTop }}>
          <div
            className="rounded-3xl border px-2 py-2 shadow-[0_22px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl"
            style={{
              background: "color-mix(in srgb, var(--c-surface) 82%, transparent)",
              borderColor: "color-mix(in srgb, var(--c-border) 70%, transparent)",
            }}
          >
            {/* MOBILE: 1 linha */}
            <div
              className={`grid gap-2 md:hidden ${bloquearCadastro ? "opacity-70" : ""}`}
              style={{ gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))` }}
              role="navigation"
              aria-label="Etapas do cadastro"
            >
              {visibleSteps.map((step, idx) => {
                const active = currentStep === step.id;
                const completed = idx < currentIndex;
                const disabled = bloquearCadastro || idx > currentIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (disabled) return;
                      goToStep(step.id);
                    }}
                    disabled={disabled}
                    className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-md"
                        : completed
                        ? "bg-[var(--c-surface)]/96 text-[var(--c-muted)] border border-[var(--c-border)]"
                        : "bg-transparent text-[var(--c-muted)]/85 border border-transparent"
                    } ${disabled ? "cursor-not-allowed" : "hover:shadow-sm"}`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                        active
                          ? "bg-white/20"
                          : completed
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "bg-[var(--c-surface)]/90 border border-[var(--c-border)] text-[var(--c-muted)]"
                      }`}
                    >
                      {completed ? <CheckCircle2 size={14} /> : idx + 1}
                    </span>
                    <span className="mt-1 text-[11px] font-semibold leading-tight text-center">{step.label}</span>
                    <span className="mt-0.5 text-[9px] uppercase tracking-[0.18em] opacity-70">
                      Etapa {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* DESKTOP: pílulas */}
            <ul className={`hidden md:flex flex-wrap gap-2 ${bloquearCadastro ? "opacity-70" : ""}`} role="navigation" aria-label="Etapas do cadastro">
              {visibleSteps.map((step, idx) => {
                const active = currentStep === step.id;
                const completed = idx < currentIndex;
                const disabled = bloquearCadastro || idx > currentIndex;

                return (
                  <li key={step.id} className="flex-1 min-w-[150px] list-none">
                    <button
                      type="button"
                      onClick={() => {
                        if (disabled) return;
                        goToStep(step.id);
                      }}
                      disabled={disabled}
                      className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs md:text-sm transition-all ${
                        active
                          ? "bg-[var(--primary)] text-white shadow-md"
                          : completed
                          ? "bg-[var(--c-surface)]/96 text-[var(--c-muted)] border border-[var(--c-border)]"
                          : "bg-transparent text-[var(--c-muted)]/85 border border-transparent"
                      } ${disabled ? "cursor-not-allowed" : "hover:shadow-sm"}`}
                      aria-current={active ? "step" : undefined}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          active
                            ? "bg-white/20"
                            : completed
                            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "bg-[var(--c-surface)]/90 border border-[var(--c-border)] text-[var(--c-muted)]"
                        }`}
                      >
                        {completed ? <CheckCircle2 size={14} /> : idx + 1}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-medium">{step.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                          Etapa {idx + 1} de {totalSteps}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* REMOVIDO: barra de progresso logo após o indicador principal */}
          </div>
        </div>

        {/* Âncora real do conteúdo da etapa (para rolagem inteligente no mobile) */}
        <div
          ref={contentAnchorRef}
          style={{
            scrollMarginTop: "calc(var(--app-header-h, 72px) + 18px)",
          }}
        />

        {/* Etapas */}
        {!bloquearCadastro && (
          <StepAmbient>
            {currentStep === 1 && (
              <StepTitularIntro
                glassCardStyle={glassCardStyle}
                titular={titular}
                updTit={updTit}
                stepAttempted={stepAttempted}
                submitAttempted={submitAttempted}
                setStepAttempted={setStepAttempted}
                validateDadosComplementares={validateDadosComplementares}
                setCurrentStep={goToStep}
                ecRef={ecRef}
                sexoRef={sexoRef}
              />
            )}

            {currentStep === 2 && (
              <StepEndereco
                glassCardStyle={glassCardStyle}
                titular={titular}
                updTitEndereco={updTitEndereco}
                addressTouched={addressTouched}
                setAddrTouched={setAddrTouched}
                cepState={cepState}
                onCepChange={(v) => {
                  setCepState((s) => ({ ...s, error: "", found: false }));
                  updTitEndereco({ cep: v });
                  debouncedBuscaCEP(v);
                }}
                onCepBlur={(v) => fetchCEP(v, applyViaCepData)}
                stepAttempted={stepAttempted}
                submitAttempted={submitAttempted}
                setStepAttempted={setStepAttempted}
                validateEndereco={validateEndereco}
                setCurrentStep={(s) => goToStep(s)} // StepEndereco normalmente pede 3; mapStep já pula para 4 se necessário
                cepRef={cepRef}
                logRef={logRef}
                numRef={numRef}
                bairroRef={bairroRef}
                cidadeRef={cidadeRef}
                ufRef={ufRef}
                UF_PADRAO={UF_PADRAO}
              />
            )}

            {!isPlanoIndividual && currentStep === 3 && (
              <StepDependentes
                glassCardStyle={glassCardStyle}
                depsExistentes={depsExistentes}
                depsNovos={depsNovos}
                depsIssuesNovos={depsIssuesNovos}
                addDepNovo={addDepNovo}
                delDepNovo={delDepNovo}
                updDepNovo={updDepNovo}
                countDepsFora={countDepsFora}
                idadeMinDep={idadeMinDep}
                idadeMaxDep={idadeMaxDep}
                plano={plano}
                stepAttempted={stepAttempted}
                submitAttempted={submitAttempted}
                setStepAttempted={setStepAttempted}
                validateDependentes={validateDependentes}
                setCurrentStep={goToStep}
              />
            )}

            {currentStep === 4 && (
              <StepCarne
                glassCardStyle={glassCardStyle}
                diaDSelecionado={diaDSelecionado}
                setDiaDSelecionado={setDiaDSelecionado}
                dataEfetivacaoISO={dataEfetivacaoISO}
                valorMensalidadePlano={valorMensalidadePlano}
                composicaoMensalidade={composicaoMensalidade}
                cobrancasPreview={cobrancasPreview}
                onBack={onBackFromCarne}
                onFinalizar={handleSalvarEnviar}
                saving={saving}
              />
            )}
          </StepAmbient>
        )}

        {/* Modal de troca de plano (a qualquer momento) */}
        <Modal open={planModalOpen} title="Trocar plano" onClose={() => setPlanModalOpen(false)}>
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="md:col-span-2">
                <p className="text-xs text-[var(--c-muted)]">
                  Selecione um plano. O cálculo de mensalidade e cobranças será atualizado automaticamente.
                </p>
              </div>
              <div className="md:col-span-1">
                <input
                  value={planSearch}
                  onChange={(ev) => setPlanSearch(ev.target.value)}
                  placeholder="Buscar por nome ou ID"
                  className="w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>
            </div>

            {planListState.loading && (
              <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/70 p-4 text-sm text-[var(--c-muted)]">
                Carregando planos…
              </div>
            )}

            {planListState.error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {planListState.error}
              </div>
            )}

            {!planListState.loading && !planListState.error && (
              <div className="pr-1">
                <div className="grid gap-3 md:grid-cols-2">
                  {planosFiltrados.map((p) => {
                    const id = p?.id ?? p?.planoId;
                    const active = Number(id) === Number(planoIdState);
                    const valorAdesao = Number(p?.valorAdesao ?? p?.valor_adesao ?? 0);
                    const aceita = [
                      p?.pagamentoPix ? "Pix" : null,
                      p?.pagamentoBoleto ? "Boleto" : null,
                      p?.pagamentoCartao ? "Cartão" : null,
                    ].filter(Boolean);

                    return (
                      <button
                        key={String(id)}
                        type="button"
                        onClick={() => applySelectedPlano(p)}
                        className={`text-left rounded-3xl border p-4 transition ${
                          active
                            ? "border-[var(--primary)] bg-[var(--primary)]/10"
                            : "border-[var(--c-border)] bg-[var(--c-surface)]/75 hover:bg-[var(--c-surface)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--c-muted)]">Plano #{id}</p>
                            <p className="mt-0.5 text-sm font-semibold truncate">{p?.nome || "Plano"}</p>
                          </div>
                          {active ? (
                            <span className="inline-flex items-center rounded-full bg-[var(--primary)] text-white px-3 py-1 text-[11px] font-semibold">
                              Atual
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <FieldRead label="Taxa de adesão" value={moneyBRL(valorAdesao)} mono />
                          <FieldRead label="Pagamento" value={aceita.length ? aceita.join(" • ") : "—"} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {(!planosFiltrados || planosFiltrados.length === 0) && (
                  <div className="mt-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/70 p-4 text-sm text-[var(--c-muted)]">
                    Nenhum plano encontrado com este filtro.
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/80 px-5 py-2.5 text-sm font-semibold hover:bg-[var(--c-surface)] transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </section>
  );
}
