// src/hooks/useCpfLookup.js
import { useState } from "react";
import { onlyDigits, formatCPF, normalizeISODate } from "@/lib/br";

function normalizePessoaToTitular(p){
  const endereco = p?.endereco || p?.address || p?.logradouro ? {
    cep: p?.endereco?.cep || p?.cep || "",
    logradouro: p?.endereco?.logradouro || p?.logradouro || "",
    numero: p?.endereco?.numero || p?.numero || "",
    complemento: p?.endereco?.complemento || p?.complemento || "",
    bairro: p?.endereco?.bairro || p?.bairro || "",
    cidade: p?.endereco?.cidade || p?.cidade || "",
    uf: (p?.endereco?.uf || p?.uf || "").toUpperCase().slice(0,2)
  } : { cep:"", logradouro:"", numero:"", complemento:"", bairro:"", cidade:"", uf:"" };

  const contatos = p?.contatos || {};
  const celular = contatos?.celular || p?.celular || "";
  const email   = contatos?.email   || p?.email   || "";

  return {
    id: p?.id || p?.pessoaId || null,
    nome: p?.nome || "",
    cpf: p?.cpf || "",
    rg: p?.rg || "",
    estado_civil: p?.estadoCivil || "",
    sexo: p?.sexo === "MULHER" ? "MULHER" : (p?.sexo === "HOMEM" ? "HOMEM" : ""),
    data_nascimento: normalizeISODate(p?.dataNascimento || ""),
    celular, email, endereco
  };
}

async function tryGet(fn){ try{ const r=await fn(); return r?.data ?? null; }catch{ return null; } }

export default function useCpfLookup(api){
  const [lookupState, setLookupState] = useState({
    running:false, pessoaEncontrada:null, temContratoAtivo:false, contratosResumo:[], mensagem:"", erro:""
  });

  async function buscarPessoaPorCPF(cpfMasked){
    let data = await tryGet(()=>api.get(`/api/v1/pessoas/cpf/${cpfMasked}`));
    if (data && (data.id || data.pessoaId)) return data;

    data = await tryGet(()=>api.get(`/api/v1/pessoas/by-cpf/${onlyDigits(cpfMasked)}`));
    if (data && (data.id || data.pessoaId)) return data;

    data = await tryGet(()=>api.get(`/api/v1/pessoas`, { params:{ cpf: onlyDigits(cpfMasked) } }));
    if (Array.isArray(data) && data.length) return data[0];
    if (data && (data.id || data.pessoaId)) return data;

    data = await tryGet(()=>api.get(`/api/v1/app/me`));
    if (data && onlyDigits(data.cpf||"") === onlyDigits(cpfMasked)) return data;

    return null;
  }

  function contratoAtivoPredicate(c){
    const status = (c?.status || c?.contratoAtivo || c?.ativo || "").toString().toUpperCase();
    if (status === "ATIVO" || status === "TRUE" || status === "1") return true;
    if (typeof c?.contratoAtivo === "boolean") return c.contratoAtivo;
    if (typeof c?.ativo === "boolean") return c.ativo;
    return true;
  }

  async function buscarContratosDaPessoaPorCPF(cpfMasked){
    let data = await tryGet(()=>api.get(`/api/v1/contratos/cpf/${cpfMasked}`));
    if (Array.isArray(data) && data.length) return data;
    if (data?.contratos?.length) return data.contratos;

    data = await tryGet(()=>api.get(`/api/v1/contratos/consulta/cpf/${onlyDigits(cpfMasked)}`));
    if (Array.isArray(data) && data.length) return data;
    if (data?.contratos?.length) return data.contratos;

    data = await tryGet(()=>api.get(`/api/v1/app/contratos/me`));
    if (Array.isArray(data) && data.length) return data;

    return [];
  }

  async function runLookupByCpf(cpfMasked, { prefillFromPessoa = true } = {}){
    const cpfFmt = formatCPF(cpfMasked || "");
    setLookupState({ running:true, pessoaEncontrada:null, temContratoAtivo:false, contratosResumo:[], mensagem:"", erro:"" });
    try{
      const pessoaRaw = await buscarPessoaPorCPF(cpfFmt);
      const contratos = await buscarContratosDaPessoaPorCPF(cpfFmt);
      const ativos = contratos.filter(contratoAtivoPredicate);

      setLookupState({
        running:false,
        pessoaEncontrada: pessoaRaw ? normalizePessoaToTitular(pessoaRaw) : null,
        temContratoAtivo: ativos.length > 0,
        contratosResumo: contratos,
        mensagem: pessoaRaw
          ? (ativos.length > 0
              ? "Encontramos um contrato ativo vinculado ao seu CPF."
              : "Encontramos seu cadastro e preenchemos seus dados.")
          : "Não localizamos cadastro anterior para este CPF. Você pode prosseguir normalmente.",
        erro:""
      });

      return { pessoaRaw, contratos, ativos };
    }catch(e){
      setLookupState(s=>({ ...s, running:false, mensagem:"", erro: e?.response?.data?.message || e?.message || "Falha ao verificar CPF agora." }));
      return { pessoaRaw:null, contratos:[], ativos:[] };
    }
  }

  return { lookupState, runLookupByCpf };
}
