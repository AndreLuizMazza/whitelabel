// src/pages/Cadastro.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import { money } from "@/lib/planUtils.js";
import useTenant from "@/store/tenant";
import { resolveTenantPhone, resolveGlobalFallback, buildWaHref } from "@/lib/whats";
import {
  CheckCircle2,
  ChevronLeft,
  AlertTriangle,
  MessageCircle,
  Plus,
  Trash2,
  Info,
  Loader2,
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
  labelParentesco,
  ESTADO_CIVIL_OPTIONS,
  ESTADO_CIVIL_LABEL,
  SEXO_OPTIONS,
  DIA_D_OPTIONS,
} from "@/lib/constants";

import { efetivacaoProxMesPorDiaD, ageFromDate } from "@/lib/dates";
import { useDebouncedCallback } from "@/lib/hooks";
import { useViaCep } from "@/lib/useViaCep";

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
        return JSON.parse(decodeURIComponent(p));
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
  const [currentStep, setCurrentStep] = useState(1);
  const [stepAttempted, setStepAttempted] = useState({ 1: false, 2: false, 3: false });

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
  const addDepNovo = () =>
    setDepsNovos((prev) => [
      ...prev,
      { nome: "", cpf: "", sexo: "", parentesco: "", data_nascimento: "" },
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

  function validateStep1() {
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

  function validateStep2() {
    const addr = titular.endereco || {};
    const errors = [];
    if (!(cepDigits.length === 8) || cepState.error) errors.push("cep");
    if (!addr.logradouro?.trim()) errors.push("logradouro");
    if (!addr.numero?.trim()) errors.push("numero");
    if (!addr.bairro?.trim()) errors.push("bairro");
    if (!addr.cidade?.trim()) errors.push("cidade");
    if (!(ufClean && ufClean.length === 2)) errors.push("uf");
    if (errors.length > 0) {
      focusByField(errors[0]);
      return false;
    }
    return true;
  }

  function validateStep3() {
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

      if (!titularId) {
        const pessoaRes = await api.post("/api/v1/pessoas", payloadPessoa);
        titularId = pessoaRes?.data?.id || pessoaRes?.data?.pessoaId || pessoaRes?.data?.uuid;
        if (!titularId) throw new Error("Não foi possível obter o ID do titular (etapa pessoa).");
      }

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
        for (const depPayload of depsToCreate) await api.post("/api/v1/dependentes", depPayload);
      }

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
        `${i + 1}. ${d.nome} - ${labelParentesco(d.parentesco)} - ${sexoLabelFromValue(
          d.sexo
        )} - CPF: ${formatCPF(d.cpf || "") || "(não informado)"} - nasc.: ${
          d.data_nascimento || ""
        }`
      )
    );

    L.push("\n*Dependentes novos*:");
    if (!depsNovos.length) L.push("(Nenhum)");
    depsNovos.forEach((d, i) =>
      L.push(
        `${i + 1}. ${d.nome || "(sem nome)"} - ${labelParentesco(
          d.parentesco
        )} - ${sexoLabelFromValue(d.sexo)} - CPF: ${
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

  const errorCount = errorList.length;
  const bloquearCadastro = lookupState.temContratoAtivo === true;

  const glassCardStyle = {
    background: "color-mix(in srgb, var(--c-surface) 78%, transparent)",
    borderColor: "color-mix(in srgb, var(--c-border) 72%, transparent)",
    boxShadow: "0 24px 80px rgba(15,23,42,0.45)",
    backdropFilter: "blur(18px)",
  };

  const steps = [
    { id: 1, label: "Dados complementares" },
    { id: 2, label: "Endereço" },
    { id: 3, label: "Dependentes" },
    { id: 4, label: "Finalização" },
  ];

  const totalSteps = steps.length || 1;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const canGoBack = currentStep > 1;
  const goNext = () => setCurrentStep((s) => Math.min(4, s + 1));
  const goPrev = () => setCurrentStep((s) => Math.max(1, s - 1));

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
              className="flex flex-wrap gap-2 rounded-3xl border px-2 py-2 shadow-[0_22px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl"
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
                        if (completed || active) setCurrentStep(step.id);
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
                Dados do titular
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

          {!bloquearCadastro && currentStep === 1 && (
            <div className="border-t border-[color-mix(in srgb,var(--c-border) 65%,transparent)] pt-5">
              <SectionTitle>Dados complementares</SectionTitle>

              <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-12">
                <div className="md:col-span-6">
                  <label className="label text-xs font-medium" htmlFor="titular-ec">
                    Estado civil {requiredStar}
                  </label>
                  <select
                    id="titular-ec"
                    ref={ecRef}
                    className={`input h-11 w-full text-sm ${requiredRing(
                      (stepAttempted[1] || submitAttempted) && isEmpty(titular.estado_civil)
                    )}`}
                    value={titular.estado_civil}
                    onChange={(e) => updTit({ estado_civil: e.target.value })}
                    aria-required="true"
                    aria-invalid={
                      (stepAttempted[1] || submitAttempted) && isEmpty(titular.estado_civil)
                        ? "true"
                        : "false"
                    }
                  >
                    <option value="">Selecione…</option>
                    {ESTADO_CIVIL_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {(stepAttempted[1] || submitAttempted) && isEmpty(titular.estado_civil) && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      Selecione o estado civil.
                    </p>
                  )}
                </div>

                <div className="md:col-span-6">
                  <label className="label text-xs font-medium" htmlFor="titular-sexo">
                    Sexo {requiredStar}
                  </label>
                  <select
                    id="titular-sexo"
                    ref={sexoRef}
                    className={`input h-11 w-full text-sm ${requiredRing(
                      (stepAttempted[1] || submitAttempted) && isEmpty(titular.sexo)
                    )}`}
                    value={titular.sexo}
                    onChange={(e) => updTit({ sexo: e.target.value })}
                    aria-required="true"
                    aria-invalid={
                      (stepAttempted[1] || submitAttempted) && isEmpty(titular.sexo)
                        ? "true"
                        : "false"
                    }
                  >
                    <option value="">Selecione…</option>
                    {SEXO_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {(stepAttempted[1] || submitAttempted) && isEmpty(titular.sexo) && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      Selecione o sexo.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <CTAButton
                  type="button"
                  className="h-11 px-6"
                  onClick={() => {
                    setStepAttempted((prev) => ({ ...prev, 1: true }));
                    if (validateStep1()) {
                      setCurrentStep(2);
                    }
                  }}
                >
                  Continuar
                </CTAButton>
              </div>
            </div>
          )}
        </div>

        {!bloquearCadastro && currentStep === 2 && (
          <div className="mt-6 rounded-3xl p-6 md:p-7 space-y-4" style={glassCardStyle}>
            <SectionTitle>Endereço</SectionTitle>

            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="label text-xs font-medium" htmlFor="end-cep">
                    CEP {requiredStar}
                  </label>
                  <button
                    type="button"
                    className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)] hover:opacity-80 disabled:opacity-40"
                    onClick={() => fetchCEP(titular.endereco.cep, applyViaCepData)}
                    disabled={cepState.loading || onlyDigits(titular.endereco.cep).length !== 8}
                    aria-label="Buscar endereço pelo CEP"
                  >
                    {cepState.loading ? "Buscando…" : "Buscar CEP"}
                  </button>
                </div>
                <input
                  id="end-cep"
                  ref={cepRef}
                  className={`input h-11 text-sm ${
                    requiredRing(
                      (stepAttempted[2] || submitAttempted) &&
                        onlyDigits(titular.endereco.cep || "").length !== 8
                    ) || (cepState.error ? " ring-1 ring-red-500" : "")
                  }`}
                  inputMode="numeric"
                  maxLength={9}
                  value={formatCEP(titular.endereco.cep)}
                  onChange={(e) => {
                    const v = maskCEP(e.target.value);
                    onCepChange(v);
                  }}
                  onBlur={(e) => onCepBlur(e.target.value)}
                  placeholder="00000-000"
                  autoComplete="postal-code"
                  aria-required="true"
                  aria-invalid={
                    ((stepAttempted[2] || submitAttempted) &&
                      onlyDigits(titular.endereco.cep || "").length !== 8) ||
                    !!cepState.error
                      ? "true"
                      : "false"
                  }
                  aria-describedby={cepState.error ? "cep-error" : undefined}
                />
                {(stepAttempted[2] || submitAttempted) &&
                  onlyDigits(titular.endereco.cep || "").length !== 8 &&
                  !cepState.error && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      CEP deve ter 8 dígitos.
                    </p>
                  )}
                {cepState.error && (
                  <p
                    id="cep-error"
                    className="text-xs text-red-600 mt-1"
                    role="alert"
                    aria-live="polite"
                  >
                    {cepState.error}
                  </p>
                )}
                {!cepState.error && cepState.found && (
                  <p className="text-xs text-green-700 mt-1" aria-live="polite">
                    Endereço preenchido pelo CEP.
                  </p>
                )}
              </div>

              <div className="grid gap-3 grid-cols-[minmax(0,2.2fr),minmax(0,1fr)] md:grid-cols-[minmax(0,3fr),minmax(0,1fr)]">
                <div>
                  <label className="label text-xs font-medium" htmlFor="end-log">
                    Logradouro {requiredStar}
                  </label>
                  <input
                    id="end-log"
                    ref={logRef}
                    className={`input h-11 text-sm ${requiredRing(
                      (stepAttempted[2] || submitAttempted) &&
                        isEmpty(titular.endereco.logradouro)
                    )}`}
                    value={titular.endereco.logradouro}
                    onChange={(e) => {
                      setAddrTouched({ logradouro: true });
                      updTitEndereco({ logradouro: e.target.value });
                    }}
                    autoComplete="address-line1"
                    aria-required="true"
                    aria-invalid={
                      (stepAttempted[2] || submitAttempted) &&
                      isEmpty(titular.endereco.logradouro)
                        ? "true"
                        : "false"
                    }
                    disabled={cepState.loading}
                  />
                  {(stepAttempted[2] || submitAttempted) &&
                    isEmpty(titular.endereco.logradouro) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Informe o logradouro.
                      </p>
                    )}
                </div>
                <div>
                  <label className="label text-xs font-medium" htmlFor="end-num">
                    Número {requiredStar}
                  </label>
                  <input
                    id="end-num"
                    ref={numRef}
                    className={`input h-11 text-sm ${requiredRing(
                      (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.numero)
                    )}`}
                    value={titular.endereco.numero}
                    onChange={(e) => updTitEndereco({ numero: e.target.value })}
                    autoComplete="address-line2"
                    aria-required="true"
                    aria-invalid={
                      (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.numero)
                        ? "true"
                        : "false"
                    }
                    disabled={cepState.loading}
                  />
                  {(stepAttempted[2] || submitAttempted) &&
                    isEmpty(titular.endereco.numero) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Informe o número.
                      </p>
                    )}
                </div>
              </div>

              <div>
                <label className="label text-xs font-medium" htmlFor="end-comp">
                  Complemento
                </label>
                <input
                  id="end-comp"
                  className="input h-11 text-sm"
                  value={titular.endereco.complemento}
                  onChange={(e) => updTitEndereco({ complemento: e.target.value })}
                  disabled={cepState.loading}
                />
              </div>

              <div>
                <label className="label text-xs font-medium" htmlFor="end-bairro">
                  Bairro {requiredStar}
                </label>
                <input
                  id="end-bairro"
                  ref={bairroRef}
                  className={`input h-11 text-sm ${requiredRing(
                    (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.bairro)
                  )}`}
                  value={titular.endereco.bairro}
                  onChange={(e) => {
                    setAddrTouched({ bairro: true });
                    updTitEndereco({ bairro: e.target.value });
                  }}
                  aria-required="true"
                  aria-invalid={
                    (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.bairro)
                      ? "true"
                      : "false"
                  }
                  disabled={cepState.loading}
                />
                {(stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.bairro) && (
                  <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                    Informe o bairro.
                  </p>
                )}
              </div>

              <div className="grid gap-3 grid-cols-[minmax(0,3fr),80px] md:grid-cols-[minmax(0,3fr),120px]">
                <div>
                  <label className="label text-xs font-medium" htmlFor="end-cidade">
                    Cidade {requiredStar}
                  </label>
                  <input
                    id="end-cidade"
                    ref={cidadeRef}
                    className={`input h-11 text-sm ${requiredRing(
                      (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.cidade)
                    )}`}
                    value={titular.endereco.cidade}
                    onChange={(e) => {
                      setAddrTouched({ cidade: true });
                      const cidade = e.target.value;
                      const uf = titular.endereco.uf || UF_PADRAO || "";
                      updTitEndereco({ cidade, uf });
                    }}
                    autoComplete="address-level2"
                    aria-required="true"
                    aria-invalid={
                      (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.cidade)
                        ? "true"
                        : "false"
                    }
                    disabled={cepState.loading}
                  />
                  {(stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.cidade) && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      Informe a cidade.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label text-xs font-medium" htmlFor="end-uf">
                    UF {requiredStar}
                  </label>
                  <input
                    id="end-uf"
                    ref={ufRef}
                    className={`input h-11 text-sm ${requiredRing(
                      (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.uf)
                    )}`}
                    value={titular.endereco.uf}
                    onChange={(e) => {
                      setAddrTouched({ uf: true });
                      const v = sanitizeUF(e.target.value);
                      updTitEndereco({ uf: v });
                    }}
                    maxLength={2}
                    autoComplete="address-level1"
                    aria-required="true"
                    aria-invalid={
                      (stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.uf)
                        ? "true"
                        : "false"
                    }
                    disabled={cepState.loading}
                  />
                  {(stepAttempted[2] || submitAttempted) && isEmpty(titular.endereco.uf) && (
                    <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                      Informe a UF.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <CTAButton type="button" variant="outline" className="h-11 px-5" onClick={goPrev}>
                Voltar
              </CTAButton>
              <CTAButton
                type="button"
                className="h-11 px-6"
                onClick={() => {
                  setStepAttempted((prev) => ({ ...prev, 2: true }));
                  if (validateStep2()) {
                    setCurrentStep(3);
                  }
                }}
              >
                Continuar
              </CTAButton>
            </div>
          </div>
        )}

        {!bloquearCadastro && currentStep === 3 && (
          <>
            {depsExistentes.length > 0 && (
              <details
                className="mt-6 rounded-3xl border px-6 py-5 md:px-7 md:py-6 backdrop-blur-xl"
                style={glassCardStyle}
                open
              >
                <summary className="cursor-pointer list-none">
                  <SectionTitle>Dependentes existentes (somente leitura)</SectionTitle>
                </summary>
                <div className="mt-4 grid gap-3">
                  {depsExistentes.map((d, i) => (
                    <div
                      key={d.id || i}
                      className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/90 p-3 grid md:grid-cols-12 gap-3 shadow-sm"
                    >
                      <div className="md:col-span-4">
                        <p className="text-[11px] text-[var(--c-muted)]">Nome</p>
                        <p className="font-medium break-words text-[13px]">{d.nome}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-[var(--c-muted)]">CPF</p>
                        <p className="font-medium text-[13px]">{formatCPF(d.cpf || "") || "—"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-[var(--c-muted)]">Parentesco</p>
                        <p className="font-medium text-[13px]">
                          {PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-[var(--c-muted)]">Sexo</p>
                        <p className="font-medium text-[13px]">
                          {sexoLabelFromValue(d.sexo) || "—"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-[var(--c-muted)]">Nascimento</p>
                        <p className="font-medium text-[13px]">
                          {formatDateBR(d.data_nascimento) || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="mt-6 rounded-3xl p-6 md:p-7" style={glassCardStyle}>
              <SectionTitle
                right={
                  <CTAButton onClick={addDepNovo} className="h-10">
                    <Plus size={16} className="mr-2" />
                    Adicionar dependente
                  </CTAButton>
                }
              >
                Novos dependentes ({depsNovos.length})
              </SectionTitle>

              <div className="mt-4 grid gap-4">
                {depsNovos.map((d, i) => {
                  const issue = depsIssuesNovos[i];
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-4 shadow-md"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--c-border)] text-[11px]">
                            {i + 1}
                          </span>
                          Dependente novo
                        </span>
                        <CTAButton
                          variant="ghost"
                          onClick={() => delDepNovo(i)}
                          className="h-9 px-3"
                          aria-label={`Remover dependente novo ${i + 1}`}
                        >
                          <Trash2 size={16} className="mr-2" /> Remover
                        </CTAButton>
                      </div>

                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <label className="label text-xs font-medium" htmlFor={`depN-${i}-nome`}>
                            Nome completo {requiredStar}
                          </label>
                          <input
                            id={`depN-${i}-nome`}
                            className={`input h-11 w-full text-sm ${requiredRing(
                              (stepAttempted[3] || submitAttempted) &&
                                !((d.nome || "").trim().length >= 3)
                            )}`}
                            placeholder="Nome do dependente"
                            value={d.nome}
                            onChange={(e) => updDepNovo(i, { nome: e.target.value })}
                            aria-required="true"
                            aria-invalid={
                              (stepAttempted[3] || submitAttempted) &&
                              !((d.nome || "").trim().length >= 3)
                                ? "true"
                                : "false"
                            }
                          />
                          {(stepAttempted[3] || submitAttempted) &&
                            !((d.nome || "").trim().length >= 3) && (
                              <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                                Informe o nome (mín. 3 caracteres).
                              </p>
                            )}
                        </div>
                        <div className="md:col-span-3">
                          <label
                            className="label text-xs font-medium"
                            htmlFor={`depN-${i}-parentesco`}
                          >
                            Parentesco {requiredStar}
                          </label>
                          <select
                            id={`depN-${i}-parentesco`}
                            className={`input h-11 w-full text-sm ${requiredRing(
                              (stepAttempted[3] || submitAttempted) && isEmpty(d.parentesco)
                            )}`}
                            value={d.parentesco}
                            onChange={(e) => updDepNovo(i, { parentesco: e.target.value })}
                            aria-required="true"
                            aria-invalid={
                              (stepAttempted[3] || submitAttempted) && isEmpty(d.parentesco)
                                ? "true"
                                : "false"
                            }
                          >
                            <option value="">Selecione…</option>
                            {(plano?.parentescos?.length
                              ? plano.parentescos
                              : PARENTESCOS_FALLBACK.map(([v]) => v)
                            ).map((v) => (
                              <option key={v} value={v}>
                                {PARENTESCO_LABELS[v] || v}
                              </option>
                            ))}
                          </select>
                          {(stepAttempted[3] || submitAttempted) && isEmpty(d.parentesco) && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              Selecione o parentesco.
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-3">
                          <label className="label text-xs font-medium" htmlFor={`depN-${i}-sexo`}>
                            Sexo {requiredStar}
                          </label>
                          <select
                            id={`depN-${i}-sexo`}
                            className={`input h-11 w-full text-sm ${requiredRing(
                              (stepAttempted[3] || submitAttempted) && isEmpty(d.sexo)
                            )}`}
                            value={d.sexo || ""}
                            onChange={(e) => updDepNovo(i, { sexo: e.target.value })}
                            aria-required="true"
                            aria-invalid={
                              (stepAttempted[3] || submitAttempted) && isEmpty(d.sexo)
                                ? "true"
                                : "false"
                            }
                          >
                            <option value="">Selecione…</option>
                            {SEXO_OPTIONS.map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                          {(stepAttempted[3] || submitAttempted) && isEmpty(d.sexo) && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              Selecione o sexo.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-12 mt-2">
                        <div className="md:col-span-6">
                          <label className="label text-xs font-medium" htmlFor={`depN-${i}-cpf`}>
                            CPF (opcional)
                          </label>
                          <input
                            id={`depN-${i}-cpf`}
                            className={`input h-11 w-full text-sm ${
                              d.cpf && !cpfIsValid(d.cpf) ? "ring-1 ring-red-500" : ""
                            }`}
                            inputMode="numeric"
                            maxLength={14}
                            placeholder="000.000.000-00"
                            value={formatCPF(d.cpf || "")}
                            onChange={(e) => updDepNovo(i, { cpf: maskCPF(e.target.value) })}
                            aria-invalid={d.cpf && !cpfIsValid(d.cpf) ? "true" : "false"}
                          />
                          {d.cpf && !cpfIsValid(d.cpf) && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              CPF inválido.
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-6">
                          <label className="label text-xs font-medium">
                            Data de nascimento {requiredStar}
                          </label>
                          <DateSelectBR
                            className="w-full"
                            idPrefix={`depN-${i}-nasc`}
                            valueISO={d.data_nascimento}
                            onChangeISO={(iso) => updDepNovo(i, { data_nascimento: iso })}
                            invalid={Boolean(
                              (stepAttempted[3] || submitAttempted) &&
                                (!d.data_nascimento || issue?.fora)
                            )}
                            minAge={
                              Number.isFinite(idadeMinDep) ? Number(idadeMinDep) : undefined
                            }
                            maxAge={
                              Number.isFinite(idadeMaxDep) ? Number(idadeMaxDep) : undefined
                            }
                          />
                          {(stepAttempted[3] || submitAttempted) && !d.data_nascimento && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              Informe a data de nascimento.
                            </p>
                          )}
                          {(stepAttempted[3] || submitAttempted) &&
                            d.data_nascimento &&
                            issue?.fora && (
                              <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                                Data fora do limite etário do plano.
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {countDepsFora > 0 && (
                <p
                  className="mt-2 text-xs inline-flex items-center gap-1 text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertTriangle size={14} /> {countDepsFora} dependente(s) fora do limite etário do
                  plano.
                </p>
              )}

              <div className="mt-6 flex justify-between gap-3">
                <CTAButton type="button" variant="outline" className="h-11 px-5" onClick={goPrev}>
                  Voltar
                </CTAButton>
                <CTAButton
                  type="button"
                  className="h-11 px-6"
                  onClick={() => {
                    setStepAttempted((prev) => ({ ...prev, 3: true }));
                    if (validateStep3()) {
                      setCurrentStep(4);
                    }
                  }}
                >
                  Continuar
                </CTAButton>
              </div>
            </div>
          </>
        )}

        {!bloquearCadastro && currentStep === 4 && (
          <>
            <div className="mt-6 rounded-3xl p-6 md:p-7" style={glassCardStyle}>
              <SectionTitle>Cobrança</SectionTitle>
              <div className="mt-3 grid gap-3 md:grid-cols-3 items-stretch">
                <div className="md:col-span-1">
                  <label className="label text-xs font-medium" htmlFor="diaD">
                    Dia D (vencimento)
                  </label>
                  <select
                    id="diaD"
                    className="input h-11 w-full text-sm"
                    value={diaDSelecionado}
                    onChange={(e) => setDiaDSelecionado(Number(e.target.value))}
                  >
                    {DIA_D_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--c-muted)] mt-1">
                    A primeira cobrança ocorre na <b>data de efetivação</b> abaixo (próximo mês).
                  </p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-3 shadow-sm">
                    <p className="text-[11px] text-[var(--c-muted)]">Data de efetivação</p>
                    <p className="font-medium text-[14px] mt-1">{formatDateBR(dataEfetivacaoISO)}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-3 shadow-sm">
                    <p className="text-[11px] text-[var(--c-muted)]">Mensalidade</p>
                    <p className="font-medium text-[14px] mt-1">
                      {money(valorMensalidadePlano)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-6 p-6 md:p-7 rounded-3xl border backdrop-blur-xl shadow-[0_26px_90px_rgba(15,23,42,0.5)]"
              style={{
                background: "color-mix(in srgb, var(--c-surface) 80%, transparent)",
                borderColor: "color-mix(in srgb, var(--c-border) 70%, transparent)",
              }}
            >
              <SectionTitle>Resumo financeiro</SectionTitle>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">Plano</span>
                  <span className="font-medium text-right">{plano?.nome}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">Base mensal</span>
                  <span>{money(baseMensal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">
                    Dependentes incluídos no plano
                  </span>
                  <span>{numDepsIncl}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">
                    Dependentes adicionais (
                    {Math.max(0, depsExistentes.length + depsNovos.length - numDepsIncl)}) ×{" "}
                    {money(valorIncMensal)}
                  </span>
                  <span>
                    {money(
                      Math.max(
                        0,
                        depsExistentes.length + depsNovos.length - numDepsIncl
                      ) * valorIncMensal
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">Adesão (única)</span>
                  <span>{money(valorAdesaoPlano)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">Dia D</span>
                  <span>{diaDSelecionado}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">Efetivação</span>
                  <span className="font-medium">{formatDateBR(dataEfetivacaoISO)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--c-muted)]">Mensalidade</span>
                  <span>{money(valorMensalidadePlano)}</span>
                </div>

                <hr className="my-2 border-[color-mix(in srgb,var(--c-border) 70%,transparent)]" />

                <div className="flex justify-between items-baseline gap-3">
                  <span className="font-semibold text-[15px]">Total mensal</span>
                  <span className="text-[color:var(--primary)] font-extrabold text-lg md:text-xl">
                    {money(totalMensal)}
                  </span>
                </div>
                {cupom ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-[var(--c-muted)]">Cupom aplicado</span>
                    <span className="font-medium">{cupom}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 mb-6 rounded-3xl p-6 md:p-7" style={glassCardStyle}>
              {submitAttempted && errorList.length > 0 && (
                <div
                  className="rounded-2xl px-4 py-3 text-sm mb-4 backdrop-blur-md"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--primary) 40%, transparent)",
                    background: "color-mix(in srgb, var(--c-surface) 80%, transparent)",
                    color: "var(--text)",
                  }}
                  role="alert"
                  aria-live="assertive"
                  ref={alertRef}
                  tabIndex={-1}
                >
                  <p className="font-semibold mb-1">
                    Revise os campos antes de continuar ({errorCount}):
                  </p>
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

              <div className="mb-4 flex justify-start">
                {canGoBack && (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--c-muted)] hover:text-[var(--text)]"
                  >
                    <ChevronLeft size={14} />
                    Voltar para dependentes
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CTAButton
                  type="button"
                  onClick={handleSalvarEnviar}
                  disabled={saving}
                  className="h-12 w-full text-[15px] font-semibold"
                  aria-disabled={saving ? "true" : "false"}
                  title="Concluir contratação"
                >
                  {saving ? "Enviando…" : "Concluir contratação"}
                </CTAButton>

                <CTAButton
                  variant="outline"
                  onClick={sendWhatsFallback}
                  className="h-12 w-full text-[15px] font-semibold"
                  title="Enviar cadastro por WhatsApp"
                >
                  <MessageCircle size={16} className="mr-2" /> Enviar por WhatsApp
                </CTAButton>
              </div>

              <p className="mt-3 text-[11px] text-[var(--c-muted)] inline-flex items-center gap-1">
                <CheckCircle2 size={14} /> Seus dados não são gravados neste dispositivo.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
