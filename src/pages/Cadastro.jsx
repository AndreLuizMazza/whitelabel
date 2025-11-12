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

// === utils centralizados ===
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

// =============== minis locais ===============
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function decodePayloadParam(p) {
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

function openWhatsApp(number, message) {
  const n = number ? onlyDigits(number) : "";
  const text = encodeURIComponent(message || "");
  const url = n ? `https://wa.me/${n}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, "_blank", "noopener");
}

// --------- UI helpers padronizados ---------
const isEmpty = (v) => !String(v || "").trim();
const requiredRing = (cond) => (cond ? "ring-1 ring-red-500" : "");
const requiredStar = <span aria-hidden="true" className="text-red-600">*</span>;

const AREA_ASSOCIADO_PATH = (import.meta?.env?.VITE_ASSOC_AREA_PATH || "/area").toString();

// =============== Página ===============
export default function Cadastro() {
  const q = useQuery();
  const navigate = useNavigate();
  const empresa = useTenant((s) => s.empresa);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // refs para foco em erros
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
    id: null, // sempre id da Pessoa (nunca do usuário)
    nome: "",
    cpf: "",
    rg: "", // mantido no estado para compatibilidade (não exibido)
    estado_civil: "",
    sexo: "",
    data_nascimento: "",
    celular: "",
    email: "",
    endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" },
  };

  const [titular, setTitular] = useState(defaultTitular);

  // Dependentes existentes (somente leitura) e novos (editáveis)
  const [depsExistentes, setDepsExistentes] = useState([]);
  const [depsNovos, setDepsNovos] = useState([]);

  // Dia D (vencimento)
  const [diaDSelecionado, setDiaDSelecionado] = useState(10);

  // ===== Estado da checagem CPF/Pessoa/Contrato =====
  const [lookupState, setLookupState] = useState({
    running: false,
    pessoaEncontrada: null,
    temContratoAtivo: false,
    contratosResumo: [],
    mensagem: "",
    erro: "",
  });

  // ======= helpers de chamada =======
  async function tryGet(apiCall, label) {
    try {
      const r = await apiCall();
      return r?.data ?? null;
    } catch {
      return null;
    }
  }

  // Busca PESSOA pelo CPF — nunca retorna /app/me
  async function buscarPessoaPorCPF(cpfMasked) {
    let data = await tryGet(() => api.get(`/api/v1/pessoas/cpf/${cpfMasked}`), "pessoas/cpf");
    if (data && (data.id || data.pessoaId)) return data;

    data = await tryGet(() => api.get(`/api/v1/pessoas/by-cpf/${onlyDigits(cpfMasked)}`), "pessoas/by-cpf");
    if (data && (data.id || data.pessoaId)) return data;

    data = await tryGet(() => api.get(`/api/v1/pessoas`, { params: { cpf: onlyDigits(cpfMasked) } }), "pessoas?cpf");
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
      id: p?.id || p?.pessoaId || null, // IMPORTANTE: id da Pessoa
      nome: p?.nome || "",
      cpf: p?.cpf || "",
      rg: p?.rg || "", // compatibilidade silenciosa; não exibido
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
    const data = await tryGet(
      () => api.get(`/api/v1/dependentes/pessoa/${encodeURIComponent(pessoaId)}`),
      "dependentes/pessoa"
    );
    if (!Array.isArray(data)) return [];
    return data;
  }

  async function buscarContratosDaPessoaPorCPF(cpfMasked) {
    const data = await tryGet(() => api.get(`/api/v1/contratos/cpf/${cpfMasked}`), "contratos/cpf");
    if (Array.isArray(data)) return data;
    if (data?.contratos && Array.isArray(data.contratos)) return data.contratos;
    return [];
  }

  function contratoAtivoPredicate(c) {
    const status = (c?.status || c?.contratoAtivo || c?.ativo || "").toString().toUpperCase();
    if (status === "ATIVO" || status === "TRUE" || status === "1") return true;
    if (typeof c?.contratoAtivo === "boolean") return c.contratoAtivo;
    if (typeof c?.ativo === "boolean") return c.ativo;
    return true; // fallback otimista
  }

  async function runLookupByCpf(cpfMasked, { prefillFromPessoa = true } = {}) {
    const cpfFmt = formatCPF(cpfMasked || "");
    if (!cpfIsValid(cpfFmt)) {
      setLookupState((s) => ({
        ...s,
        running: false,
        pessoaEncontrada: null,
        temContratoAtivo: false,
        contratosResumo: [],
        mensagem: "",
        erro: "",
      }));
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
      // 1) pessoa
      const pessoaRaw = await buscarPessoaPorCPF(cpfFmt);

      if (pessoaRaw && prefillFromPessoa) {
        const pessoaNorm = normalizePessoaToTitular(pessoaRaw);
        setTitular((prev) => ({
          ...prev,
          ...pessoaNorm,
          cpf: pessoaNorm.cpf || cpfFmt,
        }));

        // dependentes existentes (somente leitura)
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

      // 2) contratos por CPF
      const contratos = await buscarContratosDaPessoaPorCPF(cpfFmt);
      const ativos = contratos.filter(contratoAtivoPredicate);

      setLookupState({
        running: false,
        pessoaEncontrada: pessoaRaw ? normalizePessoaToTitular(pessoaRaw) : null,
        temContratoAtivo: ativos.length > 0,
        contratosResumo: contratos,
        mensagem: pessoaRaw
          ? ativos.length > 0
            ? "Encontramos um contrato ativo vinculado ao seu CPF."
            : "Dados carregados a partir do CPF informado."
          : "Não localizamos cadastro anterior para este CPF. Você pode prosseguir normalmente.",
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

  // ===== Busca o usuário logado -> pessoa(cpf) -> contratos(cpf) =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.get("/api/v1/app/me").then((r) => r?.data).catch(() => null);
        if (!alive || !me) return;

        const cpfFromMe = me?.cpf || "";
        // Prefill básico
        setTitular((prev) => ({
          ...prev,
          cpf: prev?.cpf || cpfFromMe || "",
          nome: prev?.nome || me?.nome || "",
          email: prev?.email || me?.email || "",
          celular: prev?.celular || me?.celular || "",
          data_nascimento: prev?.data_nascimento || normalizeISODate(me?.dataNascimento || ""),
        }));

        if (cpfIsValid(cpfFromMe)) {
          await runLookupByCpf(cpfFromMe, { prefillFromPessoa: true });
        }
      } catch {
        // ok se não estiver logado
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // --------- ViaCEP (hook dedicado) ----------
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

  // --------- Valores e cálculos ----------
  const baseMensal = Number(plano?.mensal || 0);
  const numDepsIncl = Number(plano?.numeroDependentes || 0);
  const valorIncAnual = Number(plano?.valorIncremental || 0);
  const valorIncMensal = valorIncAnual / 12;
  const excedentes = Math.max(0, (depsExistentes.length + depsNovos.length) - numDepsIncl);
  const totalMensal = (baseMensal || 0) + excedentes * valorIncMensal;

  const valorAdesaoPlano = Number(plano?.valorAdesao ?? plano?.valor_adesao ?? 0);
  const valorMensalidadePlano = Number(totalMensal);
  const dataEfetivacaoISO = efetivacaoProxMesPorDiaD(diaDSelecionado);

  // idade limites (dependentes)
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
    setDepsNovos((prev) => [...prev, { nome: "", cpf: "", sexo: "", parentesco: "", data_nascimento: "" }]);
  const delDepNovo = (i) => setDepsNovos((prev) => prev.filter((_, idx) => idx !== i));

  // ====== Validações desta etapa ======
  const e = titular.endereco || {};
  const cepDigits = onlyDigits(e.cep || "");
  const ufClean = (e.uf || "").toUpperCase().slice(0, 2);

  function buildErrorList() {
    const items = [];

    // Titular: obrigatórios
    if (!(titular.nome && titular.nome.trim().length >= 3))
      items.push({ field: "fixo", label: "Titular: nome ausente." });
    if (!cpfIsValid(titular.cpf)) items.push({ field: "fixo", label: "Titular: CPF inválido ou ausente." });
    if (!titular.data_nascimento) items.push({ field: "fixo", label: "Titular: data de nascimento ausente." });
    if (!phoneIsValid(titular.celular)) items.push({ field: "fixo", label: "Titular: celular ausente ou inválido." });

    if (!titular.sexo) items.push({ field: "sexo", label: "Titular: selecione o sexo." });
    if (!titular.estado_civil) items.push({ field: "estado_civil", label: "Titular: selecione o estado civil." });

    // Endereço: obrigatórios
    if (!(cepDigits.length === 8)) items.push({ field: "cep", label: "Endereço: CEP deve ter 8 dígitos." });
    if (!e.logradouro?.trim()) items.push({ field: "logradouro", label: "Endereço: informe o logradouro." });
    if (!e.numero?.trim()) items.push({ field: "numero", label: "Endereço: informe o número." });
    if (!e.bairro?.trim()) items.push({ field: "bairro", label: "Endereço: informe o bairro." });
    if (!e.cidade?.trim()) items.push({ field: "cidade", label: "Endereço: informe a cidade." });
    if (!(ufClean && ufClean.length === 2)) items.push({ field: "uf", label: "Endereço: informe a UF (2 letras)." });
    if (cepState.error) items.push({ field: "cep", label: `Endereço: ${cepState.error}` });

    // Dependentes novos: tudo obrigatório exceto CPF
    depsNovos.forEach((d, i) => {
      const issue = depsIssuesNovos[i];
      if (!((d.nome || "").trim().length >= 3))
        items.push({ field: `depN-${i}-nome`, label: `Dependente novo ${i + 1}: informe o nome (mín. 3 caracteres).` });
      if (!d.parentesco)
        items.push({ field: `depN-${i}-parentesco`, label: `Dependente novo ${i + 1}: selecione o parentesco.` });
      if (!d.sexo)
        items.push({ field: `depN-${i}-sexo`, label: `Dependente novo ${i + 1}: selecione o sexo.` });
      if (!d.data_nascimento) {
        items.push({ field: `depN-${i}-nasc`, label: `Dependente novo ${i + 1}: informe a data de nascimento.` });
      } else if (issue?.fora) {
        items.push({ field: `depN-${i}-nasc`, label: `Dependente novo ${i + 1}: data fora do limite etário do plano.` });
      }
      if (d.cpf && issue?.cpfInvalido)
        items.push({ field: `depN-${i}-cpf`, label: `Dependente novo ${i + 1}: CPF inválido.` });
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
    if (field.startsWith("depN-")) {
      const el = document.getElementById(field);
      if (el) el.focus();
    }
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

  // ===== Monitora alteração manual do CPF e reexecuta lookup (com debounce) =====
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
        cpf: formatCPF(titular.cpf || ""), // API aceita mascarado; ajuste para onlyDigits se necessário
        rg: titular.rg || null, // preservado como compatibilidade (sempre null sem campo)
        dataNascimento: titular.data_nascimento || null, // yyyy-mm-dd
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

      // Sempre trabalhar com ID da PESSOA se existir
      let titularId =
        titular?.id ||
        lookupState?.pessoaEncontrada?.id ||
        lookupState?.pessoaEncontrada?.pessoaId ||
        null;

      // 1) cria pessoa só se NÃO existir
      if (!titularId) {
        const pessoaRes = await api.post("/api/v1/pessoas", payloadPessoa);
        titularId = pessoaRes?.data?.id || pessoaRes?.data?.pessoaId || pessoaRes?.data?.uuid;
        if (!titularId) throw new Error("Não foi possível obter o ID do titular (etapa pessoa).");
      }

      // 2) cria APENAS dependentes novos
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

      // 3) cria contrato
      const todayISO = new Date().toISOString().slice(0, 10);
      const payloadContrato = {
        titularId: Number(titularId), // SEMPRE ID DA PESSOA
        planoId: Number(planoId),
        vendedorId: 717, // ajuste se necessário
        dataContrato: todayISO,
        diaD: Number(diaDSelecionado),
        valorAdesao: valorAdesaoPlano,
        valorMensalidade: valorMensalidadePlano,
        dataEfetivacao: dataEfetivacaoISO,
        cupomDesconto: cupom || null,
      };

      const contratoRes = await api.post("/api/v1/contratos", payloadContrato);
      const contratoId = contratoRes?.data?.id || contratoRes?.data?.contratoId || contratoRes?.data?.uuid;

      navigate(`/confirmacao?contrato=${contratoId || ""}&titular=${titularId}`);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === "string" ? e.response.data : "") ||
        e?.message ||
        "";
      setError(
        msg ? `Não conseguimos concluir o envio: ${msg}` : "Não conseguimos concluir o envio pelo site. Você pode enviar por WhatsApp."
      );
    } finally {
      setSaving(false);
    }
  }

  function sexoLabelFromValue(v) {
    return SEXO_OPTIONS.find(([val]) => val === v)?.[1] || "";
  }

  // helper local: normaliza texto para WhatsApp
  function normalizeWaText(str) {
    let s = (str ?? "").toString();
    s = s.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/\u00A0/g, " ");
    const rawLines = s.split("\n").map((l) => l.replace(/\s+/g, " ").trim());
    const lines = [];
    for (const l of rawLines) {
      if (l === "" && lines[lines.length - 1] === "") continue;
      lines.push(l);
    }
    return lines.join("\n").trim();
  }

  function sendWhatsFallback() {
    // 1) resolve número do tenant com fallback global
    let number =
      resolveTenantPhone(empresa) ||
      resolveGlobalFallback() ||
      import.meta?.env?.VITE_WHATSAPP ||
      window.__WHATSAPP__ ||
      "";

    // 2) normaliza (só dígitos) e garante DDI 55 se faltar
    number = onlyDigits(number);
    if (number && !number.startsWith("55")) number = `55${number}`;

    // 3) montar mensagem (linhas cruas)
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
    // Linha de RG removida deliberadamente
    L.push(`Estado civil: ${ESTADO_CIVIL_LABEL[titular.estado_civil] || titular.estado_civil || ""}`);
    L.push(`Nascimento: ${formatDateBR(titular.data_nascimento) || ""}`);
    const e = titular.endereco || {};
    L.push(`End.: ${e.logradouro || ""}, ${e.numero || ""} ${e.complemento || ""} - ${e.bairro || ""}`);
    L.push(`${e.cidade || ""}/${e.uf || ""} - CEP ${e.cep || ""}`);

    L.push("\n*Dependentes existentes*:");
    if (!depsExistentes.length) L.push("(Nenhum)");
    depsExistentes.forEach((d, i) =>
      L.push(
        `${i + 1}. ${d.nome} - ${labelParentesco(d.parentesco)} - ${sexoLabelFromValue(d.sexo)} - CPF: ${
          formatCPF(d.cpf || "") || "(não informado)"
        } - nasc.: ${d.data_nascimento || ""}`
      )
    );

    L.push("\n*Dependentes novos*:");
    if (!depsNovos.length) L.push("(Nenhum)");
    depsNovos.forEach((d, i) =>
      L.push(
        `${i + 1}. ${d.nome || "(sem nome)"} - ${labelParentesco(d.parentesco)} - ${sexoLabelFromValue(d.sexo)} - CPF: ${
          formatCPF(d.cpf || "") || "(não informado)"
        } - nasc.: ${d.data_nascimento || ""}`
      )
    );

    // 4) normaliza e abre o WhatsApp
    const message = normalizeWaText(L.join("\n"));
    const href = buildWaHref({ number, message });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  // CEP interactions helpers
  const onCepChange = (v) => {
    setCepState((s) => ({ ...s, error: "", found: false }));
    updTitEndereco({ cep: v });
    debouncedBuscaCEP(v);
  };
  const onCepBlur = (v) => fetchCEP(v, applyViaCepData);

  const errorCount = errorList.length;

  const bloquearCadastro = lookupState.temContratoAtivo === true;

  return (
    <section className="section">
      <div className="container-max">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)]"
            aria-label="Voltar para a página anterior"
          >
            <ChevronLeft size={16} /> Voltar
          </button>
        </div>

        {/* ====== Banner de checagem CPF/Pessoa/Contrato ====== */}
        {(lookupState.running || lookupState.mensagem || lookupState.erro) && (
          <div
            className="mb-4 rounded-xl border p-4"
            style={{
              background: "color-mix(in srgb, var(--primary) 10%, transparent)",
              borderColor: "color-mix(in srgb, var(--primary) 35%, transparent)",
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
              <div className="flex-1">
                {lookupState.running && <p className="text-sm">Verificando CPF e contratos…</p>}
                {!lookupState.running && lookupState.mensagem && (
                  <p className="text-sm font-medium">{lookupState.mensagem}</p>
                )}
                {!lookupState.running && lookupState.erro && (
                  <p className="text-sm text-red-700">Falha na verificação automática: {lookupState.erro}</p>
                )}

                {/* Se há contrato ativo, oferece CTA para a área do associado */}
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

        {/* ALERTA GLOBAL DE ERRO API */}
        {error && (
          <div
            ref={alertRef}
            role="alert"
            tabIndex={-1}
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--text)",
            }}
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Card 1: Dados do Titular (sempre exibimos leitura) */}
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <h1 className="text-2xl font-extrabold tracking-tight">Cadastro</h1>
            <p className="mt-1 text-sm text-[var(--c-muted)]">
              Plano <b>{plano?.nome || ""}</b> — Base mensal {money(baseMensal)}
            </p>

            <div className="mt-6">
              <h2 className="font-semibold text-lg">Seus dados (usuário/Pessoa)</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--c-border)] p-3">
                  <p className="text-[var(--c-muted)] text-xs">Nome</p>
                  <p className="font-medium break-words">{titular.nome || "—"}</p>
                </div>
                <div className="rounded-xl border border-[var(--c-border)] p-3">
                  <p className="text-[var(--c-muted)] text-xs">CPF</p>
                  <p className="font-medium">{formatCPF(titular.cpf || "") || "—"}</p>
                </div>
                <div className="rounded-xl border border-[var(--c-border)] p-3">
                  <p className="text-[var(--c-muted)] text-xs">Data de nascimento</p>
                  <p className="font-medium">{formatDateBR(titular.data_nascimento) || "—"}</p>
                </div>
                <div className="rounded-xl border border-[var(--c-border)] p-3">
                  <p className="text-[var(--c-muted)] text-xs">Celular</p>
                  <p className="font-medium">{formatPhoneBR(titular.celular || "") || "—"}</p>
                </div>
                <div className="rounded-xl border border-[var(--c-border)] p-3 md:col-span-2">
                  <p className="text-[var(--c-muted)] text-xs">E-mail</p>
                  <p className="font-medium break-words">{titular.email || "—"}</p>
                </div>
              </div>
            </div>

            {/* Complemento — só se não houver contrato ativo */}
            {!bloquearCadastro && (
              <div className="mt-8">
                <h2 className="font-semibold text-lg">Complemento do cadastro</h2>

                <div className="mt-3 grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <label className="label" htmlFor="titular-ec">
                      Estado civil {requiredStar}
                    </label>
                    <select
                      id="titular-ec"
                      ref={ecRef}
                      className={`input h-11 w-full ${requiredRing(
                        submitAttempted && isEmpty(titular.estado_civil)
                      )}`}
                      value={titular.estado_civil}
                      onChange={(e) => updTit({ estado_civil: e.target.value })}
                      aria-required="true"
                      aria-invalid={submitAttempted && isEmpty(titular.estado_civil) ? "true" : "false"}
                    >
                      <option value="">Selecione…</option>
                      {ESTADO_CIVIL_OPTIONS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    {submitAttempted && isEmpty(titular.estado_civil) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Selecione o estado civil.
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-6">
                    <label className="label" htmlFor="titular-sexo">
                      Sexo {requiredStar}
                    </label>
                    <select
                      id="titular-sexo"
                      ref={sexoRef}
                      className={`input h-11 w-full ${requiredRing(submitAttempted && isEmpty(titular.sexo))}`}
                      value={titular.sexo}
                      onChange={(e) => updTit({ sexo: e.target.value })}
                      aria-required="true"
                      aria-invalid={submitAttempted && isEmpty(titular.sexo) ? "true" : "false"}
                    >
                      <option value="">Selecione…</option>
                      {SEXO_OPTIONS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    {submitAttempted && isEmpty(titular.sexo) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Selecione o sexo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Endereço — só se não houver contrato ativo */}
          {!bloquearCadastro && (
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
              <h2 className="font-semibold text-lg">Endereço</h2>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 md:grid-cols-[210px,1fr,140px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label" htmlFor="end-cep">
                        CEP {requiredStar}
                      </label>
                      <button
                        type="button"
                        className="text-xs underline text-[var(--c-muted)] hover:opacity-80 disabled:opacity-50"
                        onClick={() => fetchCEP(titular.endereco.cep, applyViaCepData)}
                        disabled={cepState.loading || onlyDigits(titular.endereco.cep).length !== 8}
                        aria-label="Buscar endereço pelo CEP"
                      >
                        {cepState.loading ? "Buscando..." : "Buscar CEP"}
                      </button>
                    </div>
                    <input
                      id="end-cep"
                      ref={cepRef}
                      className={`input h-11 ${
                        requiredRing(submitAttempted && onlyDigits(titular.endereco.cep || "").length !== 8) ||
                        (cepState.error ? " ring-1 ring-red-500" : "")
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
                        (submitAttempted && onlyDigits(titular.endereco.cep || "").length !== 8) || !!cepState.error
                          ? "true"
                          : "false"
                      }
                      aria-describedby={cepState.error ? "cep-error" : undefined}
                    />
                    {submitAttempted &&
                      onlyDigits(titular.endereco.cep || "").length !== 8 &&
                      !cepState.error && (
                        <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                          CEP deve ter 8 dígitos.
                        </p>
                      )}
                    {cepState.error && (
                      <p id="cep-error" className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        {cepState.error}
                      </p>
                    )}
                    {!cepState.error && cepState.found && (
                      <p className="text-xs text-green-700 mt-1" aria-live="polite">
                        Endereço preenchido pelo CEP.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="end-log">
                      Logradouro {requiredStar}
                    </label>
                    <input
                      id="end-log"
                      ref={logRef}
                      className={`input h-11 ${requiredRing(submitAttempted && isEmpty(titular.endereco.logradouro))}`}
                      value={titular.endereco.logradouro}
                      onChange={(e) => {
                        setAddrTouched({ logradouro: true });
                        updTitEndereco({ logradouro: e.target.value });
                      }}
                      autoComplete="address-line1"
                      aria-required="true"
                      aria-invalid={submitAttempted && isEmpty(titular.endereco.logradouro) ? "true" : "false"}
                      disabled={cepState.loading}
                    />
                    {submitAttempted && isEmpty(titular.endereco.logradouro) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Informe o logradouro.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="end-num">
                      Número {requiredStar}
                    </label>
                    <input
                      id="end-num"
                      ref={numRef}
                      className={`input h-11 ${requiredRing(submitAttempted && isEmpty(titular.endereco.numero))}`}
                      value={titular.endereco.numero}
                      onChange={(e) => updTitEndereco({ numero: e.target.value })}
                      autoComplete="address-line2"
                      aria-required="true"
                      aria-invalid={submitAttempted && isEmpty(titular.endereco.numero) ? "true" : "false"}
                      disabled={cepState.loading}
                    />
                    {submitAttempted && isEmpty(titular.endereco.numero) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Informe o número.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,100px]">
                  <div>
                    <label className="label" htmlFor="end-comp">
                      Complemento
                    </label>
                    <input
                      id="end-comp"
                      className="input h-11"
                      value={titular.endereco.complemento}
                      onChange={(e) => updTitEndereco({ complemento: e.target.value })}
                      disabled={cepState.loading}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="end-bairro">
                      Bairro {requiredStar}
                    </label>
                    <input
                      id="end-bairro"
                      ref={bairroRef}
                      className={`input h-11 ${requiredRing(submitAttempted && isEmpty(titular.endereco.bairro))}`}
                      value={titular.endereco.bairro}
                      onChange={(e) => {
                        setAddrTouched({ bairro: true });
                        updTitEndereco({ bairro: e.target.value });
                      }}
                      aria-required="true"
                      aria-invalid={submitAttempted && isEmpty(titular.endereco.bairro) ? "true" : "false"}
                      disabled={cepState.loading}
                    />
                    {submitAttempted && isEmpty(titular.endereco.bairro) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Informe o bairro.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="end-cidade">
                      Cidade {requiredStar}
                    </label>
                    <input
                      id="end-cidade"
                      ref={cidadeRef}
                      className={`input h-11 ${requiredRing(submitAttempted && isEmpty(titular.endereco.cidade))}`}
                      value={titular.endereco.cidade}
                      onChange={(e) => {
                        setAddrTouched({ cidade: true });
                        const cidade = e.target.value;
                        const uf = titular.endereco.uf || UF_PADRAO || "";
                        updTitEndereco({ cidade, uf });
                      }}
                      autoComplete="address-level2"
                      aria-required="true"
                      aria-invalid={submitAttempted && isEmpty(titular.endereco.cidade) ? "true" : "false"}
                      disabled={cepState.loading}
                    />
                    {submitAttempted && isEmpty(titular.endereco.cidade) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Informe a cidade.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="end-uf">
                      UF {requiredStar}
                    </label>
                    <input
                      id="end-uf"
                      ref={ufRef}
                      className={`input h-11 ${requiredRing(submitAttempted && isEmpty(titular.endereco.uf))}`}
                      value={titular.endereco.uf}
                      onChange={(e) => {
                        setAddrTouched({ uf: true });
                        const v = sanitizeUF(e.target.value);
                        updTitEndereco({ uf: v });
                      }}
                      maxLength={2}
                      autoComplete="address-level1"
                      aria-required="true"
                      aria-invalid={submitAttempted && isEmpty(titular.endereco.uf) ? "true" : "false"}
                      disabled={cepState.loading}
                    />
                    {submitAttempted && isEmpty(titular.endereco.uf) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Informe a UF.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dependentes existentes (somente leitura) */}
          {!bloquearCadastro && depsExistentes.length > 0 && (
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
              <h2 className="font-semibold text-lg">Dependentes existentes (somente leitura)</h2>
              <div className="mt-4 grid gap-3">
                {depsExistentes.map((d, i) => (
                  <div key={d.id || i} className="rounded-xl border p-3 grid md:grid-cols-12 gap-3 bg-[var(--c-muted-bg,transparent)]">
                    <div className="md:col-span-4">
                      <p className="text-xs text-[var(--c-muted)]">Nome</p>
                      <p className="font-medium break-words">{d.nome}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-[var(--c-muted)]">CPF</p>
                      <p className="font-medium">{formatCPF(d.cpf || "") || "—"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-[var(--c-muted)]">Parentesco</p>
                      <p className="font-medium">{PARENTESCO_LABELS[d.parentesco] || d.parentesco || "—"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-[var(--c-muted)]">Sexo</p>
                      <p className="font-medium">{sexoLabelFromValue(d.sexo) || "—"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-[var(--c-muted)]">Nascimento</p>
                      <p className="font-medium">{formatDateBR(d.data_nascimento) || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependentes novos — só se não houver contrato ativo */}
          {!bloquearCadastro && (
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">
                  Adicionar novos dependentes ({depsNovos.length})
                </h2>
                <CTAButton onClick={addDepNovo} className="h-10">
                  <Plus size={16} className="mr-2" />
                  Adicionar dependente
                </CTAButton>
              </div>

              <div className="mt-4 grid gap-4">
                {depsNovos.map((d, i) => {
                  const issue = depsIssuesNovos[i];
                  return (
                    <div key={i} className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">Dependente novo {i + 1}</span>
                        <CTAButton variant="ghost" onClick={() => delDepNovo(i)} className="h-9 px-3" aria-label={`Remover dependente novo ${i + 1}`}>
                          <Trash2 size={16} className="mr-2" /> Remover
                        </CTAButton>
                      </div>

                      {/* Linha 1 */}
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <label className="label" htmlFor={`depN-${i}-nome`}>
                            Nome completo {requiredStar}
                          </label>
                          <input
                            id={`depN-${i}-nome`}
                            className={`input h-11 w-full ${requiredRing(submitAttempted && !((d.nome || "").trim().length >= 3))}`}
                            placeholder="Nome do dependente"
                            value={d.nome}
                            onChange={(e) => updDepNovo(i, { nome: e.target.value })}
                            aria-required="true"
                            aria-invalid={submitAttempted && !((d.nome || "").trim().length >= 3) ? "true" : "false"}
                          />
                          {submitAttempted && !((d.nome || "").trim().length >= 3) && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              Informe o nome (mín. 3 caracteres).
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-3">
                          <label className="label" htmlFor={`depN-${i}-parentesco`}>
                            Parentesco {requiredStar}
                          </label>
                          <select
                            id={`depN-${i}-parentesco`}
                            className={`input h-11 w-full ${requiredRing(submitAttempted && isEmpty(d.parentesco))}`}
                            value={d.parentesco}
                            onChange={(e) => updDepNovo(i, { parentesco: e.target.value })}
                            aria-required="true"
                            aria-invalid={submitAttempted && isEmpty(d.parentesco) ? "true" : "false"}
                          >
                            <option value="">Selecione…</option>
                            {(plano?.parentescos?.length ? plano.parentescos : PARENTESCOS_FALLBACK.map(([v]) => v)).map((v) => (
                              <option key={v} value={v}>
                                {PARENTESCO_LABELS[v] || v}
                              </option>
                            ))}
                          </select>
                          {submitAttempted && isEmpty(d.parentesco) && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              Selecione o parentesco.
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-3">
                          <label className="label" htmlFor={`depN-${i}-sexo`}>
                            Sexo {requiredStar}
                          </label>
                          <select
                            id={`depN-${i}-sexo`}
                            className={`input h-11 w-full ${requiredRing(submitAttempted && isEmpty(d.sexo))}`}
                            value={d.sexo || ""}
                            onChange={(e) => updDepNovo(i, { sexo: e.target.value })}
                            aria-required="true"
                            aria-invalid={submitAttempted && isEmpty(d.sexo) ? "true" : "false"}
                          >
                            <option value="">Selecione…</option>
                            {SEXO_OPTIONS.map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                          {submitAttempted && isEmpty(d.sexo) && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              Selecione o sexo.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Linha 2 */}
                      <div className="grid gap-3 md:grid-cols-12 mt-2">
                        <div className="md:col-span-6">
                          <label className="label" htmlFor={`depN-${i}-cpf`}>
                            CPF (opcional)
                          </label>
                          <input
                            id={`depN-${i}-cpf`}
                            className={`input h-11 w-full ${d.cpf && !cpfIsValid(d.cpf) ? "ring-1 ring-red-500" : ""}`}
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
                          <label className="label">Data de nascimento {requiredStar}</label>
                          <DateSelectBR
                            className="w-full"
                            idPrefix={`depN-${i}-nasc`}
                            valueISO={d.data_nascimento}
                            onChangeISO={(iso) => updDepNovo(i, { data_nascimento: iso })}
                            invalid={Boolean(submitAttempted && (!d.data_nascimento || issue?.fora))}
                            minAge={Number.isFinite(idadeMinDep) ? Number(idadeMinDep) : undefined}
                            maxAge={Number.isFinite(idadeMaxDep) ? Number(idadeMaxDep) : undefined}
                          />
                          {submitAttempted && !d.data_nascimento && (
                            <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                              Informe a data de nascimento.
                            </p>
                          )}
                          {submitAttempted && d.data_nascimento && issue?.fora && (
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
                <p className="mt-2 text-xs inline-flex items-center gap-1 text-red-600" role="alert" aria-live="polite">
                  <AlertTriangle size={14} /> {countDepsFora} dependente(s) fora do limite etário do plano.
                </p>
              )}
            </div>
          )}

          {/* Cobrança (Dia D) — só se não houver contrato ativo */}
          {!bloquearCadastro && (
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
              <h3 className="text-lg font-semibold">Cobrança</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label className="label" htmlFor="diaD">
                    Dia D (vencimento)
                  </label>
                  <select
                    id="diaD"
                    className="input h-11 w-full"
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
                  <div className="rounded-xl border border-[var(--c-border)] p-3">
                    <p className="text-[var(--c-muted)] text-xs">Data de efetivação</p>
                    <p className="font-medium">{formatDateBR(dataEfetivacaoISO)}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] p-3">
                    <p className="text-[var(--c-muted)] text-xs">Mensalidade</p>
                    <p className="font-medium">{money(valorMensalidadePlano)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resumo — sempre exibe (só leitura) */}
          <div className="p-6 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Plano</span>
                <span className="font-medium text-right">{plano?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Base mensal</span>
                <span>{money(baseMensal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Incluídos no plano</span>
                <span>{numDepsIncl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">
                  Dependentes adicionais ({Math.max(0, (depsExistentes.length + depsNovos.length) - numDepsIncl)}) × {money(valorIncMensal)}
                </span>
                <span>{money(Math.max(0, (depsExistentes.length + depsNovos.length) - numDepsIncl) * valorIncMensal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Adesão (única)</span>
                <span>{money(valorAdesaoPlano)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Dia D</span>
                <span>{diaDSelecionado}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Efetivação</span>
                <span className="font-medium">{formatDateBR(dataEfetivacaoISO)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--c-muted)]">Mensalidade</span>
                <span>{money(valorMensalidadePlano)}</span>
              </div>

              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total mensal</span>
                <span className="text-[color:var(--primary)] font-extrabold">{money(totalMensal)}</span>
              </div>
              {cupom ? (
                <div className="flex justify-between">
                  <span className="text-[var(--c-muted)]">Cupom</span>
                  <span className="font-medium">{cupom}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Ações — só se não houver contrato ativo */}
          {!bloquearCadastro && (
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
              {submitAttempted && errorList.length > 0 && (
                <div
                  className="rounded-lg px-4 py-3 text-sm mb-4"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                    background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                    color: "var(--text)",
                  }}
                  role="alert"
                  aria-live="assertive"
                  ref={alertRef}
                  tabIndex={-1}
                >
                  <p className="font-medium mb-1">Corrija os itens abaixo ({errorCount}):</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CTAButton
                  type="button"
                  onClick={handleSalvarEnviar}
                  disabled={saving}
                  className="h-12 w-full"
                  aria-disabled={saving ? "true" : "false"}
                  title="Salvar e continuar"
                >
                  {saving ? "Enviando…" : "Salvar e continuar"}
                </CTAButton>

              <CTAButton
                variant="outline"
                onClick={sendWhatsFallback}
                className="h-12 w-full"
                title="Enviar cadastro por WhatsApp"
              >
                <MessageCircle size={16} className="mr-2" /> Enviar por WhatsApp
              </CTAButton>
              </div>

              <p className="mt-3 text-xs text-[var(--c-muted)] inline-flex items-center gap-1">
                <CheckCircle2 size={14} /> Seus dados não são gravados neste dispositivo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* mobile sticky footer */}
      {!bloquearCadastro && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-surface)] md:hidden"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))", boxShadow: "0 -12px 30px rgba(0,0,0,.12)" }}
          >
            <div className="mx-auto max-w-7xl px-3 py-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-[var(--c-muted)] leading-tight">Total mensal</p>
                <p className="text-xl font-extrabold leading-tight">{money(totalMensal)}</p>
              </div>
              <CTAButton
                className="min-w-[44%] h-12"
                type="button"
                onClick={handleSalvarEnviar}
                disabled={saving}
                aria-disabled={saving ? "true" : "false"}
                title="Salvar e continuar"
              >
                {saving ? "Enviando…" : "Continuar"}
              </CTAButton>
            </div>
          </div>
          <div className="h-16 md:hidden" aria-hidden />
        </>
      )}
    </section>
  );
}
