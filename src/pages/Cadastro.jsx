// src/pages/Cadastro.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import useTenant from "@/store/tenant";
import { celcashCriarClienteContrato, celcashGerarCarneManual } from "@/lib/celcashApi";

import { ChevronLeft, Info, Loader2, X } from "lucide-react";

import {
  onlyDigits,
  cpfIsValid,
  formatCPF,
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
import CadastroStepShell, { CadastroStepper } from "./cadastro/CadastroStepShell";

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
    <div
      className="rounded-xl border px-3 py-2"
      style={{ borderColor: "var(--c-border)", background: "var(--surface-alt, var(--surface))" }}
    >
      <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium ${mono ? "tabular-nums" : ""} break-words`}>
        {value || "—"}
      </p>
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
 * Camada de “ambiente” premium (halo) — removida em favor de layout step-first.
 */

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
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

          <div className="px-5 py-5 max-h-[75vh] overflow-auto">{children}</div>
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

  const [planoIdState, setPlanoIdState] = useState(payload?.plano || null);

  // >>> Cupom agora é estado real (sincronizado com URL/payload)
  const [cupomCodigo, setCupomCodigo] = useState(String(payload?.cupom || "").trim().toUpperCase());

  const [plano, setPlano] = useState(payload?.planSnapshot || null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  const [planListState, setPlanListState] = useState({ loading: false, items: [], error: "" });

  function syncPayloadPatch(patch) {
    const nextPayload = {
      ...(payload || {}),
      ...(patch || {}),
    };
    const encoded = encodePayloadParam(nextPayload);
    const nextUrl = encoded ? `${location.pathname}?p=${encodeURIComponent(encoded)}` : location.pathname;
    navigate(nextUrl, { replace: true });
  }

  function applySelectedPlano(nextPlano) {
    const nextId = nextPlano?.id ?? nextPlano?.planoId ?? null;
    if (!nextId) return;

    setPlanoIdState(Number(nextId));
    setPlano(nextPlano || null);

    syncPayloadPatch({
      plano: Number(nextId),
      planSnapshot: nextPlano || null,
      cupom: cupomCodigo || "",
    });

    setPlanModalOpen(false);
    setError("");
  }

  useEffect(() => {
    if (!planModalOpen) return;

    let alive = true;
    (async () => {
      try {
        setPlanListState((s) => ({ ...s, loading: true, error: "" }));
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
    const id = "cadastro-hide-contact-cta";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
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

      // PATCH: remover “titular duplicado” vindo como dependente (por CPF ou parentesco)
      const titularCpfDigits = onlyDigits(pessoaNorm.cpf || cpfFmt || "");
      const depsFiltrados = (Array.isArray(deps) ? deps : []).filter((d) => {
        const depCpfDigits = onlyDigits(d?.cpf || "");
        const parentesco = String(d?.parentesco || "").trim().toUpperCase();

        if (parentesco === "TITULAR") return false;
        if (titularCpfDigits && depCpfDigits && depCpfDigits === titularCpfDigits) return false;

        return true;
      });

      setDepsExistentes(
        depsFiltrados.map((d) => ({
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

  // Se estiver na etapa 3 e o plano virar "individual", pula para Cobranças
  useEffect(() => {
    if (isPlanoIndividual && currentStep === 3) goToStep(4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlanoIndividual]);

  /* =======================================================================
   *  VENDEDOR (resolve por e-mail via BFF)
   * ======================================================================= */
  const [vendedorState, setVendedorState] = useState({
    loading: false,
    email: "",
    id: null,
    nome: "",
    error: "",
  });

  const vendedorIdFromPayload = useMemo(() => {
    const v = payload?.vendedorId ?? payload?.vendedorID ?? payload?.vendedor ?? null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [payload]);

  const vendedorEmailCandidate = useMemo(() => {
    const pEmail = String(payload?.vendedorEmail || payload?.emailVendedor || "").trim();
    const empEmail = String(
      empresa?.vendedorEmail || empresa?.emailVendedor || empresa?.contatos?.emailVendedor || ""
    ).trim();

    return pEmail || empEmail || "";
  }, [payload, empresa]);

  function normalizeVendedorResp(data, fallbackEmail = "") {
    const raw = Array.isArray(data) ? data[0] : data?.data ? data.data : data;
    const id = raw?.id ?? raw?.vendedorId ?? raw?.vendedorID ?? null;
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null;

    return {
      id: n,
      nome: String(raw?.nome || "").trim(),
      email: String(raw?.email || fallbackEmail || "").trim(),
    };
  }

  async function resolverVendedorPorEmail(email) {
    const ee = String(email || "").trim();
    if (!ee) return null;

    try {
      const resp = await api.get(`/api/v1/vendedores/email/${encodeURIComponent(ee)}`);
      return normalizeVendedorResp(resp?.data, ee);
    } catch {
      return null;
    }
  }

  async function resolverVendedorPadrao() {
    try {
      const resp = await api.get(`/api/v1/vendedores/padrao`);
      return normalizeVendedorResp(resp?.data, "");
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (vendedorIdFromPayload) {
        setVendedorState({ loading: false, email: "", id: vendedorIdFromPayload, nome: "", error: "" });
        return;
      }

      // evita reprocessamento
      if (vendedorState.id) return;

      setVendedorState((s) => ({ ...s, loading: true, error: "" }));

      // 1) tenta email do payload/tenant
      if (vendedorEmailCandidate) {
        const v1 = await resolverVendedorPorEmail(vendedorEmailCandidate);
        if (!alive) return;
        if (v1?.id) {
          setVendedorState({
            loading: false,
            email: v1.email || vendedorEmailCandidate,
            id: v1.id,
            nome: v1.nome || "",
            error: "",
          });
          return;
        }
      }

      // 2) tenta vendedor padrão do BFF (ENV do servidor)
      const v2 = await resolverVendedorPadrao();
      if (!alive) return;

      if (v2?.id) {
        setVendedorState({ loading: false, email: v2.email || "", id: v2.id, nome: v2.nome || "", error: "" });
        return;
      }

      setVendedorState({ loading: false, email: vendedorEmailCandidate || "", id: null, nome: "", error: "" });
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendedorIdFromPayload, vendedorEmailCandidate]);

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
  }, [titular?.cpf]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // >>> Agora aceita { cobrancas } vindo do StepCarne (com desconto e filtro > 5)
  async function handleSalvarEnviar({ cobrancas } = {}) {
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

      // Resolve vendedor: 1) payload vendedorId 2) vendedorState.id 3) fallback 717
      const vendedorIdFinal = Number(vendedorIdFromPayload || vendedorState?.id || 717);

      const todayISO = new Date().toISOString().slice(0, 10);
      const payloadContrato = {
        titularId: Number(titularId),
        planoId: Number(planoIdState),
        vendedorId: vendedorIdFinal,
        dataContrato: todayISO,
        diaD: Number(diaDSelecionado),
        valorAdesao: Number(valorAdesaoPlano || 0),
        valorMensalidade: Number(valorMensalidadePlano || 0),
        dataEfetivacao: dataEfetivacaoISO,
        cupomDesconto: cupomCodigo || null,
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
        // Se StepCarne forneceu cobranças finais (com desconto), usa isso.
        // Senão, mantém o comportamento anterior.
        let cobrancasForCelCash = [];

        if (Array.isArray(cobrancas) && cobrancas.length > 0) {
          cobrancasForCelCash = cobrancas.map((c, idx) => ({
            numeroParcela: idx + 1,
            valor: Number(c?.valor || 0),
            dataVencimento: c?.dataVencimentoISO || c?.dataVencimento || "",
          }));
        } else {
          const mensalidades = gerarCobrancasPlano(plano, dataEfetivacaoISO, valorMensalidadePlano);

          if (valorAdesaoPlano > 0) {
            cobrancasForCelCash.push({
              numeroParcela: 1,
              valor: valorAdesaoPlano,
              dataVencimento: todayISO,
            });
          }

          mensalidades.forEach((cob) => {
            cobrancasForCelCash.push({
              numeroParcela: cobrancasForCelCash.length + 1,
              valor: Number(cob.valor || 0),
              dataVencimento: cob.dataVencimentoISO,
            });
          });
        }

       
       // Segurança adicional: não enviar < 5 (e 0 cai fora automaticamente)
        cobrancasForCelCash = cobrancasForCelCash.filter((c) => Number(c?.valor || 0) >= 5);


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

  // Rolagem inteligente (mais estável no mobile)
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

  const stepMeta = useMemo(() => {
    const map = {
      1: { title: "Dados do titular", subtitle: "Complete as informações que faltam." },
      2: { title: "Endereço", subtitle: "Onde você recebe correspondências e cobranças." },
      3: { title: "Dependentes", subtitle: "Opcional — inclua quem entra no plano." },
      4: { title: "Pagamento", subtitle: "Escolha o vencimento e confirme os valores." },
    };
    return map[currentStep] || map[1];
  }, [currentStep]);

  const stickyTop = "calc(var(--app-header-h, 72px) + 4px)";

  const resumoContratacao = (
    <details
      className="order-3 md:order-2 mt-3 md:mt-0 mb-0 md:mb-4 rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--c-border)", background: "var(--surface)" }}
    >
      <summary
        className="cursor-pointer list-none px-3 py-2.5 sm:px-4 sm:py-3 text-sm font-medium min-h-[40px] sm:min-h-[48px] flex items-center justify-between gap-2"
        style={{ color: "var(--text)" }}
      >
        <span>Resumo da contratação</span>
        <span className="text-[11px] sm:text-xs font-normal" style={{ color: "var(--text-muted)" }}>
          toque para ver
        </span>
      </summary>
      <div className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4 space-y-3 border-t" style={{ borderColor: "var(--c-border)" }}>
        <div className="grid gap-2 sm:grid-cols-2">
          <FieldRead label="Titular" value={titular.nome || "—"} />
          <FieldRead label="CPF" value={formatCPF(titular.cpf || "") || "—"} mono />
          <FieldRead label="Celular" value={formatPhoneBR(titular.celular) || "—"} mono />
          <FieldRead label="E-mail" value={titular.email || "—"} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <FieldRead label="Mensalidade" value={moneyBRL(valorMensalidadePlano)} mono />
          <FieldRead label="Adesão" value={moneyBRL(valorAdesaoPlano)} mono />
          <FieldRead label="Pagamento" value={planoResumo?.formasTxt || "—"} />
        </div>
      </div>
    </details>
  );

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
    const idx = visibleSteps.findIndex((s) => s.id === currentStep);
    const prev = idx > 0 ? visibleSteps[idx - 1]?.id : 1;
    goToStep(prev || 1);
  };

  return (
    <section className="section !py-4 md:!py-10">
      <div className="container-max max-w-4xl md:max-w-5xl flex flex-col">
        <div className="mb-2 md:mb-4 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg md:rounded-full border-0 md:border border-[var(--c-border)] bg-transparent md:bg-[var(--c-surface)]/90 -ml-1 pl-1 pr-2 md:px-4 py-1.5 md:py-2 text-sm font-semibold md:shadow-sm md:hover:shadow-md md:hover:bg-[var(--c-surface)] transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[40px] md:min-h-[44px]"
            style={{ color: "var(--primary)" }}
            aria-label="Voltar para a página anterior"
          >
            <ChevronLeft size={18} /> Voltar
          </button>
        </div>

        {currentStep === 1 && (
          <header className="mb-2 md:mb-5">
            <h1 className="text-xl md:text-3xl font-semibold tracking-tight leading-tight">
              Contratar plano
            </h1>
            <p
              className="mt-0.5 text-xs md:text-sm leading-snug hidden sm:block"
              style={{ color: "var(--text-muted)" }}
            >
              {totalSteps} etapas para concluir sua adesão.
            </p>
          </header>
        )}

        <div className="mb-2 md:mb-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          {plano?.nome ? (
            <span
              className="inline-flex max-w-[min(100%,280px)] items-center rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs truncate"
              style={{ borderColor: "var(--c-border)", color: "var(--text-muted)", background: "var(--surface)" }}
            >
              <span className="truncate">{plano.nome}</span>
              {valorMensalidadePlano > 0 ? (
                <span className="ml-1.5 sm:ml-2 font-semibold shrink-0" style={{ color: "var(--text)" }}>
                  {moneyBRL(valorMensalidadePlano)}/mês
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Selecione um plano para continuar
            </span>
          )}
          <button
            type="button"
            onClick={() => setPlanModalOpen(true)}
            className="text-xs sm:text-sm font-medium hover:underline min-h-[40px] sm:min-h-[44px] px-1 sm:px-2 shrink-0"
            style={{ color: "var(--primary)" }}
          >
            Trocar plano
          </button>
        </div>

        <div className="mb-2 md:mb-4 sticky z-[35]" style={{ top: stickyTop }}>
          <CadastroStepper
            steps={visibleSteps}
            currentStep={currentStep}
            currentIndex={currentIndex}
            disabled={bloquearCadastro}
            onStep={goToStep}
            compact
          />
        </div>

        {resumoContratacao}

        {(lookupState.running || lookupState.mensagem || lookupState.erro) && (
          <div
            className="mb-3 md:mb-5 rounded-2xl md:rounded-3xl border px-3 py-3 sm:px-4 sm:py-4 backdrop-blur-xl"
            style={{
              background: "color-mix(in srgb, var(--c-surface) 82%, transparent)",
              borderColor: "color-mix(in srgb, var(--primary) 35%, transparent)",
              boxShadow: "0 20px 70px rgba(15,23,42,0.4)",
            }}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full p-2 text-white" style={{ background: "color-mix(in srgb, var(--primary) 90%, black)" }}>
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
            className="mb-3 md:mb-4 rounded-2xl md:rounded-3xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm backdrop-blur-xl"
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

        <div
          ref={contentAnchorRef}
          style={{ scrollMarginTop: "calc(var(--app-header-h, 72px) + 72px)" }}
        />

        {!bloquearCadastro && (
          <CadastroStepShell
            className="order-2 md:order-3"
            title={stepMeta.title}
            subtitle={stepMeta.subtitle}
            plain={currentStep === 4}
          >
            {currentStep === 1 && (
              <StepTitularIntro
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
                setCurrentStep={(s) => goToStep(s)}
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
                diaDSelecionado={diaDSelecionado}
                setDiaDSelecionado={setDiaDSelecionado}
                dataEfetivacaoISO={dataEfetivacaoISO}
                valorMensalidadePlano={valorMensalidadePlano}
                composicaoMensalidade={composicaoMensalidade}
                cobrancasPreview={cobrancasPreview}
                onBack={onBackFromCarne}
                onFinalizar={handleSalvarEnviar}
                saving={saving}
                initialCupomCodigo={cupomCodigo}
                onCupomApplied={(cupomData) => {
                  const codigo = String(cupomData?.codigo || "").trim().toUpperCase();
                  setCupomCodigo(codigo);
                  syncPayloadPatch({ cupom: codigo });
                }}
                onCupomRemoved={() => {
                  setCupomCodigo("");
                  syncPayloadPatch({ cupom: "" });
                }}
              />
            )}
          </CadastroStepShell>
        )}

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
                    const aceita = [p?.pagamentoPix ? "Pix" : null, p?.pagamentoBoleto ? "Boleto" : null, p?.pagamentoCartao ? "Cartão" : null].filter(Boolean);

                    return (
                      <button
                        key={String(id)}
                        type="button"
                        onClick={() => applySelectedPlano(p)}
                        className={`text-left rounded-3xl border p-4 transition ${
                          active ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--c-border)] bg-[var(--c-surface)]/75 hover:bg-[var(--c-surface)]"
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
