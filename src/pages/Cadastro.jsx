// src/pages/Cadastro.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import { money } from "@/lib/planUtils.js";
import useTenant from "@/store/tenant";
import { resolveTenantPhone, resolveGlobalFallback, buildWaHref } from "@/lib/whats";
import { celcashCriarClienteContrato, celcashGerarCarneManual } from "@/lib/celcashApi";

import {
  CheckCircle2,
  ChevronLeft,
  Info,
  Loader2,
  MessageCircle,
} from "lucide-react";

import DateSelectBR from "@/components/DateSelectBR";

import {
  onlyDigits,
  cpfIsValid,
  formatCPF,
  maskCPF,
  formatCEP,
  maskCEP,
  formatPhoneBR,
  phoneIsValid,
  sanitizeUF,
  formatDateBR,
  normalizeISODate,
} from "@/lib/br";

import {
  PARENTESCOS_FALLBACK,
  PARENTESCO_LABELS,
  ESTADO_CIVIL_OPTIONS,
  ESTADO_CIVIL_LABEL,
  SEXO_OPTIONS,
  DIA_D_OPTIONS,
} from "@/lib/constants";

import { efetivacaoProxMesPorDiaD, ageFromDate } from "@/lib/dates";
import { useDebouncedCallback } from "@/lib/hooks";
import { useViaCep } from "@/lib/useViaCep";

// Etapas (componentes)
import StepDadosComplementares from "./cadastro/StepDadosComplementares";
import StepEndereco from "./cadastro/StepEndereco";
import StepDependentes from "./cadastro/StepDependentes";
import StepCarne from "./cadastro/StepCarne";
import StepConfirmacao from "./cadastro/StepConfirmacao";

const isEmpty = (v) => !String(v || "").trim();
const requiredRing = (cond) => (cond ? "ring-1 ring-red-500" : "");
const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;
const AREA_ASSOCIADO_PATH = (import.meta?.env?.VITE_ASSOC_AREA_PATH || "/area").toString();

function FieldRead({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--c-muted)]">{label}</p>
      <p className={`mt-1 font-medium ${mono ? "tabular-nums" : ""} break-words text-[13px]`}>
        {value || "—"}
      </p>
    </div>
  );
}

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base md:text-lg font-semibold tracking-tight">{children}</h2>
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
        return JSON.parse(deURIComponent(p));
      } catch {
        return null;
      }
    }
  }
}

export default function Cadastro() {
  const q = useQuery();
  const navigate = useNavigate();
  const empresa = useTenant((s) => s.empresa);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Etapas:
  // 1 - Titular + dados complementares
  // 2 - Endereço
  // 3 - Dependentes
  // 4 - Cobrança
  // 5 - Confirmação
  const [currentStep, setCurrentStep] = useState(1);

  const [stepAttempted, setStepAttempted] = useState({
    complementares: false,
    endereco: false,
    dependentes: false,
  });

  const alertRef = useRef(null);
  const sexoRef = useRef(null);
  const ecRef = useRef(null);
  const cepRef = useRef(null);
  const logRef = useRef(null);
  const numRef = useRef(null);
  const bairroRef = useRef(null);
  const cidadeRef = useRef(null);
  const ufRef = useRef(null);

  const payload = useMemo(() => decodePayloadParam(q.get("p")), [q]);
  const planoId = payload?.plano;
  const cupom = payload?.cupom || "";
  const plano = payload?.planSnapshot || null;

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
        : { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };

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
    const data = await tryGet(() =>
      api.get(`/api/v1/dependentes/pessoa/${encodeURIComponent(pessoaId)}`)
    );
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

  async function runLookupByCpf(
    cpfMasked,
    { prefillFromPessoa = true, suppressNoCadastroMessage = false } = {}
  ) {
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
        mensagem: temPessoa
          ? ativos.length > 0
            ? "Encontramos um contrato ativo vinculado ao seu CPF."
            : "Dados carregados a partir do CPF informado."
          : suppressNoCadastroMessage
          ? ""
          : "",
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
        const me = await api
          .get("/api/v1/app/me")
          .then((r) => r?.data)
          .catch(() => null);
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
          await runLookupByCpf(cpfFromMe, {
            prefillFromPessoa: true,
            suppressNoCadastroMessage: true,
          });
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
        logradouro: addressTouched.logradouro
          ? t.endereco.logradouro
          : data.logradouro || t.endereco.logradouro,
        bairro: addressTouched.bairro ? t.endereco.bairro : data.bairro || t.endereco.bairro,
        cidade: addressTouched.cidade
          ? t.endereco.cidade
          : data.localidade || t.endereco.cidade,
        uf: addressTouched.uf
          ? sanitizeUF(t.endereco.uf)
          : sanitizeUF(data.uf || t.endereco.uf || UF_PADRAO || ""),
      },
    }));
  };

  const debouncedBuscaCEP = useDebouncedCallback((cepRaw) => {
    fetchCEP(cepRaw, applyViaCepData);
  }, 500);

  const baseMensal = Number(plano?.mensal || 0);
  const numDepsIncl = Number(plano?.numeroDependentes || 0);
  const valorIncAnual = Number(plano?.valorIncremental || 0);
  const valorIncMensal = valorIncAnual / 12;
  const excedentes = Math.max(0, depsExistentes.length + depsNovos.length - numDepsIncl);
  const totalMensal = (baseMensal || 0) + excedentes * valorIncMensal;

  const valorAdesaoPlano = Number(plano?.valorAdesao ?? plano?.valor_adesao ?? 0);
  const valorMensalidadePlano = Number(totalMensal);
  const dataEfetivacaoISO = efetivacaoProxMesPorDiaD(diaDSelecionado);

  const idadeMinDep = Number.isFinite(plano?.idadeMinimaDependente)
    ? Number(plano.idadeMinimaDependente)
    : undefined;
  const idadeMaxDep = Number.isFinite(plano?.idadeMaximaDependente)
    ? Number(plano.idadeMaximaDependente)
    : undefined;

  const depsIssuesNovos = depsNovos.map((d) => {
    const age = ageFromDate(d.data_nascimento);
    const fora =
      d.data_nascimento &&
      ((Number.isFinite(idadeMinDep) && age < idadeMinDep) ||
        (Number.isFinite(idadeMaxDep) && age > idadeMaxDep));
    const parentescoVazio = Boolean((d.nome || "").trim()) && !d.parentesco;
    const cpfInvalido = Boolean((d.cpf || "").trim()) && !cpfIsValid(d.cpf);
    return { fora, age, parentescoVazio, cpfInvalido };
  });
  const countDepsFora = depsIssuesNovos.filter((x) => x.fora).length;

  const updTit = (patch) => setTitular((t) => ({ ...t, ...patch }));
  const updTitEndereco = (patch) =>
    setTitular((t) => ({ ...t, endereco: { ...t.endereco, ...patch } }));

  const updDepNovo = (i, patch) =>
    setDepsNovos((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
const addDepNovo = (initial = {}) =>
  setDepsNovos((prev) => [
    ...prev,
    {
      nome: "",
      cpf: "",
      sexo: "",
      parentesco: "",
      data_nascimento: "",
      ...initial,
    },
  ]);
  const delDepNovo = (i) => setDepsNovos((prev) => prev.filter((_, idx) => idx !== i));

  const e = titular.endereco || {};
  const cepDigits = onlyDigits(e.cep || "");
  const ufClean = (e.uf || "").toUpperCase().slice(0, 2);

  function buildErrorList() {
    const items = [];

    if (!(titular.nome && titular.nome.trim().length >= 3))
      items.push({ field: "fixo", label: "Titular: nome ausente." });
    if (!cpfIsValid(titular.cpf))
      items.push({ field: "fixo", label: "Titular: CPF inválido ou ausente." });
    if (!titular.data_nascimento)
      items.push({ field: "fixo", label: "Titular: data de nascimento ausente." });
    if (!phoneIsValid(titular.celular))
      items.push({ field: "fixo", label: "Titular: celular ausente ou inválido." });

    if (!titular.sexo) items.push({ field: "sexo", label: "Titular: selecione o sexo." });
    if (!titular.estado_civil)
      items.push({ field: "estado_civil", label: "Titular: selecione o estado civil." });

    if (!(cepDigits.length === 8))
      items.push({ field: "cep", label: "Endereço: CEP deve ter 8 dígitos." });
    if (!e.logradouro?.trim())
      items.push({ field: "logradouro", label: "Endereço: informe o logradouro." });
    if (!e.numero?.trim())
      items.push({ field: "numero", label: "Endereço: informe o número." });
    if (!e.bairro?.trim())
      items.push({ field: "bairro", label: "Endereço: informe o bairro." });
    if (!e.cidade?.trim())
      items.push({ field: "cidade", label: "Endereço: informe a cidade." });
    if (!(ufClean && ufClean.length === 2))
      items.push({ field: "uf", label: "Endereço: informe a UF (2 letras)." });
    if (cepState.error) items.push({ field: "cep", label: `Endereço: ${cepState.error}` });

    depsNovos.forEach((d, i) => {
      const issue = depsIssuesNovos[i];
      if (!((d.nome || "").trim().length >= 3))
        items.push({
          field: `depN-${i}-nome`,
          label: `Dependente novo ${i + 1}: informe o nome (mín. 3 caracteres).`,
        });
      if (!d.parentesco)
        items.push({
          field: `depN-${i}-parentesco`,
          label: `Dependente novo ${i + 1}: selecione o parentesco.`,
        });
      if (!d.sexo)
        items.push({
          field: `depN-${i}-sexo`,
          label: `Dependente novo ${i + 1}: selecione o sexo.`,
        });
      if (!d.data_nascimento) {
        items.push({
          field: `depN-${i}-nasc`,
          label: `Dependente novo ${i + 1}: informe a data de nascimento.`,
        });
      } else if (issue?.fora) {
        items.push({
          field: `depN-${i}-nasc`,
          label: `Dependente novo ${i + 1}: data fora do limite etário do plano.`,
        });
      }
      if (d.cpf && issue?.cpfInvalido)
        items.push({
          field: `depN-${i}-cpf`,
          label: `Dependente novo ${i + 1}: CPF inválido.`,
        });
    });

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
  const errorCount = errorList.length;

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

      let titularId =
        titular?.id ||
        lookupState?.pessoaEncontrada?.id ||
        lookupState?.pessoaEncontrada?.pessoaId ||
        null;

      // 1) Garante pessoa/titular
      if (!titularId) {
        const pessoaRes = await api.post("/api/v1/pessoas", payloadPessoa);
        titularId = pessoaRes?.data?.id || pessoaRes?.data?.pessoaId || pessoaRes?.data?.uuid;
        if (!titularId) throw new Error("Não foi possível obter o ID do titular (etapa pessoa).");
      }

      // 2) Cria dependentes novos (se houver)
      if (depsNovos.length > 0) {
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

      // 3) Cria contrato no Progem
      const todayISO = new Date().toISOString().slice(0, 10);
      const payloadContrato = {
        titularId: Number(titularId),
        planoId: Number(planoId),
        vendedorId: 717,
        dataContrato: todayISO,
        diaD: Number(diaDSelecionado),
        valorAdesao: valorAdesaoPlano,
        valorMensalidade: valorMensalidadePlano,
        dataEfetivacao: dataEfetivacaoISO,
        cupomDesconto: cupom || null,
      };

      const contratoRes = await api.post("/api/v1/contratos", payloadContrato);
      const contratoId =
        contratoRes?.data?.id || contratoRes?.data?.contratoId || contratoRes?.data?.uuid;

      if (!contratoId) {
        throw new Error("Não foi possível obter o ID do contrato recém-criado.");
      }

      // 4) Integração CelCash (cliente + contrato)
      try {
        await celcashCriarClienteContrato(contratoId, {});
      } catch (err) {
        console.error("[Cadastro] Falha ao criar cliente/contrato na CelCash", err);
      }

      // 5) Integração CelCash (carnê manual)
      try {
        const carnePayload = {
          mainPaymentMethodId: "boleto",
          cobrancas: [
            {
              numeroParcela: 1,
              valor: Number(valorMensalidadePlano || 0),
              dataVencimento: dataEfetivacaoISO, // yyyy-mm-dd
            },
          ],
        };

        await celcashGerarCarneManual(contratoId, carnePayload);
      } catch (err) {
        console.error("[Cadastro] Falha ao gerar carnê manual na CelCash", err);
      }

      // 6) Navega para a tela de confirmação
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
          : "Não conseguimos concluir o envio pelo site. Você pode enviar por WhatsApp."
      );
    } finally {
      setSaving(false);
    }
  }

  function sexoLabelFromValue(v) {
    return SEXO_OPTIONS.find(([val]) => val === v)?.[1] || "";
  }

  function normalizeWaText(str) {
    let s = (str ?? "").toString();
    s = s
      .normalize("NFKC")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00A0/g, " ");
    const rawLines = s.split("\n").map((l) => l.replace(/\s+/g, " ").trim());
    const lines = [];
    for (const l of rawLines) {
      if (l === "" && lines[lines.length - 1] === "") continue;
      lines.push(l);
    }
    return lines.join("\n").trim();
  }

  function sendWhatsFallback() {
    let number =
      resolveTenantPhone(empresa) ||
      resolveGlobalFallback() ||
      import.meta?.env?.VITE_WHATSAPP ||
      window.__WHATSAPP__ ||
      "";

    number = onlyDigits(number);
    if (number && !number.startsWith("55")) number = `55${number}`;

    const L = [];
    L.push("*Solicitação de Contratação*\n");
    L.push(`Plano: ${plano?.nome || planoId}`);
    L.push(`Valor base: ${money(baseMensal)} | Total mensal: ${money(totalMensal)}`);
    L.push(`Adesão (única): ${money(valorAdesaoPlano)}`);
    L.push(`Mensalidade: ${money(valorMensalidadePlano)}`);
    L.push(`Dia D: ${diaDSelecionado}`);
    L.push(`Efetivação: ${formatDateBR(dataEfetivacaoISO)}`);
    if (cupom) L.push(`Cupom de desconto: ${cupom}`);

    L.push("\n*Titular*:");
    L.push(`Nome: ${titular.nome || ""}`);
    L.push(`CPF: ${formatCPF(titular.cpf || "")}`);
    L.push(`Sexo: ${sexoLabelFromValue(titular.sexo)}`);
    L.push(`Celular: ${formatPhoneBR(titular.celular || "")}`);
    L.push(`E-mail: ${titular.email || "(não informado)"}`);
    L.push(
      `Estado civil: ${ESTADO_CIVIL_LABEL[titular.estado_civil] || titular.estado_civil || ""}`
    );
    L.push(`Nascimento: ${formatDateBR(titular.data_nascimento) || ""}`);
    const eAddr = titular.endereco || {};
    L.push(
      `End.: ${eAddr.logradouro || ""}, ${eAddr.numero || ""} ${eAddr.complemento || ""} - ${
        eAddr.bairro || ""
      }`
    );
    L.push(`${eAddr.cidade || ""}/${eAddr.uf || ""} - CEP ${eAddr.cep || ""}`);

    L.push("\n*Dependentes existentes*:");
    if (!depsExistentes.length) L.push("(Nenhum)");
    depsExistentes.forEach((d, i) =>
      L.push(
        `${i + 1}. ${d.nome} - ${PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—"} - ${
          sexoLabelFromValue(d.sexo) || "—"
        } - CPF: ${formatCPF(d.cpf || "") || "(não informado)"} - nasc.: ${
          d.data_nascimento || ""
        }`
      )
    );

    L.push("\n*Dependentes novos*:");
    if (!depsNovos.length) L.push("(Nenhum)");
    depsNovos.forEach((d, i) =>
      L.push(
        `${i + 1}. ${d.nome || "(sem nome)"} - ${
          PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—"
        } - ${sexoLabelFromValue(d.sexo) || "—"} - CPF: ${
          formatCPF(d.cpf || "") || "(não informado)"
        } - nasc.: ${d.data_nascimento || ""}`
      )
    );

    const message = normalizeWaText(L.join("\n"));
    const href = buildWaHref({ number, message });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  const onCepChange = (v) => {
    setCepState((s) => ({ ...s, error: "", found: false }));
    updTitEndereco({ cep: v });
    debouncedBuscaCEP(v);
  };
  const onCepBlur = (v) => fetchCEP(v, applyViaCepData);

  const bloquearCadastro = lookupState.temContratoAtivo === true;

  const glassCardStyle = {
    background: "color-mix(in srgb, var(--c-surface) 84%, transparent)",
    borderColor: "color-mix(in srgb, var(--c-border) 70%, transparent)",
    boxShadow: "0 22px 70px rgba(15,23,42,0.35)",
    backdropFilter: "blur(18px)",
  };

  const steps = [
    { id: 1, label: "Dados do titular" },
    { id: 2, label: "Endereço" },
    { id: 3, label: "Dependentes" },
    { id: 4, label: "Cobranças" },
    { id: 5, label: "Confirmação" },
  ];

  const totalSteps = steps.length || 1;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const todayISO = new Date().toISOString().slice(0, 10);

  const cobrancasPreview = useMemo(() => {
    const list = [];
    if (valorAdesaoPlano > 0) {
      list.push({
        id: "adesao",
        tipo: "Taxa de adesão",
        valor: valorAdesaoPlano,
        dataVencimentoISO: todayISO,
      });
    }
    list.push({
      id: "mensal-1",
      tipo: "1ª mensalidade",
      valor: valorMensalidadePlano,
      dataVencimentoISO: dataEfetivacaoISO,
    });
    return list;
  }, [valorAdesaoPlano, valorMensalidadePlano, dataEfetivacaoISO, todayISO]);

  // === Render principal ===

  return (
    <section className="section">
      <div className="container-max max-w-4xl md:max-w-5xl">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/90 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md hover:bg-[var(--c-surface)] transition-all"
            aria-label="Voltar para a página anterior"
          >
            <ChevronLeft size={16} /> Voltar
          </button>
        </div>

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
                {!lookupState.running && lookupState.mensagem && (
                  <p className="text-sm font-medium">{lookupState.mensagem}</p>
                )}
                {!lookupState.running && lookupState.erro && (
                  <p className="text-sm text-red-700">
                    Falha na verificação automática: {lookupState.erro}
                  </p>
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

        {!bloquearCadastro && (
          <div className="mb-5">
            <ol
              className="flex flex-wrap gap-2 rounded-3xl border px-2 py-2 shadow-[0_22px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl"
              style={{
                background: "color-mix(in srgb, var(--c-surface) 78%, transparent)",
                borderColor: "color-mix(in srgb, var(--c-border) 70%, transparent)",
              }}
            >
              {steps.map((step) => {
                const active = currentStep === step.id;
                const completed = currentStep > step.id;
                return (
                  <li key={step.id} className="flex-1 min-w-[150px]">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.id <= currentStep) setCurrentStep(step.id);
                      }}
                      className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs md:text-sm transition-all ${
                        active
                          ? "bg-[var(--primary)] text-white shadow-md"
                          : completed
                          ? "bg-[var(--c-surface)]/96 text-[var(--c-muted)] border border-[var(--c-border)]"
                          : "bg-transparent text-[var(--c-muted)]/85 border border-transparent"
                      }`}
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
                        {completed ? <CheckCircle2 size={14} /> : step.id}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-medium">{step.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                          Etapa {step.id} de {totalSteps}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-3 md:hidden">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--c-muted)]">
                  Etapa {currentStep} de {totalSteps}
                </span>
                <span className="text-[11px] text-[var(--c-muted)]">
                  {progressPercent}
                  %
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--c-border)]/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cabeçalho + dados do titular (resumo sereno, estilo registro/login) */}
        <div className="rounded-3xl p-6 md:p-7 space-y-6" style={glassCardStyle}>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              Cadastro do plano
            </h1>
            <p className="text-sm md:text-[15px] text-[var(--c-muted)] flex flex-wrap gap-1">
              Plano{" "}
              <b className="font-semibold">
                {plano?.nome || ""}
              </b>
              <span className="opacity-60">•</span>
              Base mensal
              <span className="font-semibold">{money(baseMensal)}</span>
            </p>
            <p className="text-xs md:text-sm text-[var(--c-muted)]/90">
              Revise seus dados abaixo e avance com calma pelas etapas. Você poderá conferir o
              resumo financeiro antes de concluir.
            </p>
          </div>

          <details className="group open:pb-2" open>
            <summary className="cursor-pointer list-none">
              <SectionTitle
                right={
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)] group-open:opacity-60">
                    Seus dados como usuário
                  </span>
                }
              >
                Dados do titular (resumo)
              </SectionTitle>
            </summary>

            <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-4">
              <div className="col-span-2 md:col-span-2">
                <FieldRead label="Nome" value={titular.nome} />
              </div>
              <FieldRead label="CPF" value={formatCPF(titular.cpf || "")} mono />
              <FieldRead label="Nascimento" value={formatDateBR(titular.data_nascimento) || "—"} mono />
              <FieldRead label="Celular" value={formatPhoneBR(titular.celular || "") || "—"} mono />
              <div className="col-span-2 md:col-span-4">
                <FieldRead label="E-mail" value={titular.email} />
              </div>
            </div>
          </details>
        </div>

        {/* Etapas */}
        {!bloquearCadastro && (
          <>
            {currentStep === 1 && (
              <StepDadosComplementares
                glassCardStyle={glassCardStyle}
                titular={titular}
                updTit={updTit}
                stepAttempted={stepAttempted}
                submitAttempted={submitAttempted}
                setStepAttempted={setStepAttempted}
                validateDadosComplementares={validateDadosComplementares}
                onBack={null}
                onNext={() => setCurrentStep(2)}
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
                onCepChange={onCepChange}
                onCepBlur={onCepBlur}
                stepAttempted={stepAttempted}
                submitAttempted={submitAttempted}
                setStepAttempted={setStepAttempted}
                validateEndereco={validateEndereco}
                setCurrentStep={setCurrentStep}
                cepRef={cepRef}
                logRef={logRef}
                numRef={numRef}
                bairroRef={bairroRef}
                cidadeRef={cidadeRef}
                ufRef={ufRef}
                UF_PADRAO={UF_PADRAO}
              />
            )}

            {currentStep === 3 && (
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
                setCurrentStep={setCurrentStep}
              />
            )}

            {currentStep === 4 && (
              <StepCarne
                glassCardStyle={glassCardStyle}
                diaDSelecionado={diaDSelecionado}
                setDiaDSelecionado={setDiaDSelecionado}
                dataEfetivacaoISO={dataEfetivacaoISO}
                valorMensalidadePlano={valorMensalidadePlano}
                cobrancasPreview={cobrancasPreview}
                onBack={() => setCurrentStep(3)}
                onNext={() => setCurrentStep(5)}
              />
            )}

            {currentStep === 5 && (
              <StepConfirmacao
                glassCardStyle={glassCardStyle}
                submitAttempted={submitAttempted}
                errorList={errorList}
                errorCount={errorCount}
                alertRef={alertRef}
                focusByField={focusByField}
                plano={plano}
                baseMensal={baseMensal}
                numDepsIncl={numDepsIncl}
                depsExistentes={depsExistentes}
                depsNovos={depsNovos}
                valorIncMensal={valorIncMensal}
                valorAdesaoPlano={valorAdesaoPlano}
                diaDSelecionado={diaDSelecionado}
                dataEfetivacaoISO={dataEfetivacaoISO}
                valorMensalidadePlano={valorMensalidadePlano}
                totalMensal={totalMensal}
                cupom={cupom}
                handleSalvarEnviar={handleSalvarEnviar}
                saving={saving}
                sendWhatsFallback={sendWhatsFallback}
                onBack={() => setCurrentStep(4)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
