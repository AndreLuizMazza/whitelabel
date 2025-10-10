// src/pages/Cadastro.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import { money, pick, getMensal } from "@/lib/planUtils.js";
import { CheckCircle2, ChevronLeft, AlertTriangle, MessageCircle, Plus, Trash2, X } from "lucide-react";

/* =============== utils/minis =============== */
function useQuery(){ const {search}=useLocation(); return useMemo(()=>new URLSearchParams(search),[search]); }
function decodePayloadParam(p){ try{ return JSON.parse(decodeURIComponent(atob(p))); }catch{ try{ return JSON.parse(atob(p)); }catch{ try{ return JSON.parse(decodeURIComponent(p)); }catch{ return null; } } } }
const onlyDigits=(v="")=>String(v).replace(/\D+/g,"");

function cpfIsValid(cpf){
  cpf=onlyDigits(cpf);
  if(!cpf||cpf.length!==11||/^(\d)\1{10}$/.test(cpf))return false;
  let s=0; for(let i=0;i<9;i++) s+=+cpf[i]*(10-i);
  let r=11-(s%11); if(r>=10)r=0; if(r!==+cpf[9])return false;
  s=0; for(let i=0;i<10;i++) s+=+cpf[i]*(11-i);
  r=11-(s%11); if(r>=10)r=0; return r===+cpf[10];
}
const formatCPF=(v="")=>v.replace(/\D/g,"").slice(0,11)
  .replace(/^(\d{3})(\d)/,"$1.$2")
  .replace(/^(\d{3})\.(\d{3})(\d)/,"$1.$2.$3")
  .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/,"$1.$2.$3-$4");
const maskCPF=(v="")=>formatCPF(v);

const formatCEP=(v="")=>v.replace(/\D/g,"").slice(0,8).replace(/^(\d{5})(\d)/,"$1-$2");
const maskCEP=(v="")=>formatCEP(v);

function openWhatsApp(number,message){
  const n=number?onlyDigits(number):"";
  const text=encodeURIComponent(message||"");
  const url=n?`https://wa.me/${n}?text=${text}`:`https://wa.me/?text=${text}`;
  window.open(url,"_blank","noopener");
}

/* ===== telefone BR ===== */
function formatPhoneBR(v=""){
  const d=onlyDigits(v).slice(0,11);
  if(d.length===0) return "";
  if(d.length<=2) return `(${d}`;
  if(d.length<=6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if(d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6,10)}`;
  if(d.length>=11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
  return d;
}
const maskPhone=(v="")=>formatPhoneBR(v);
function phoneIsValid(v){ const d=onlyDigits(v); return d.length===11 || d.length===10; }

/* ===== parentescos fallback (usado só se API vier vazia) ===== */
const PARENTESCOS_FALLBACK = [
  ["CONJUGE","Cônjuge"],["COMPANHEIRO","Companheiro(a)"] ,["FILHO","Filho(a)"],["PAI","Pai"],["MAE","Mãe"],["IRMAO","Irmã(o)"],["AVO","Avô(ó)"],["TITULAR","Titular"],
  ["RESPONSAVEL","Responsável"],["TIO","Tio(a)"],["SOBRINHO","Sobrinho(a)"],["PRIMO","Primo(a)"],["NETO","Neto(a)"],["BISNETO","Bisneto(a)"],["PADRASTO","Padrasto"],["MADRASTRA","Madrasta"],
  ["AFILHADO","Afilhado(a)"],["ENTEADA","Enteado(a)"],["SOGRO","Sogro(a)"],["GENRO","Genro"],["NORA","Nora"],["CUNHADO","Cunhado(a)"],["BISAVO","Bisavô(ó)"],["MADRINHA","Madrinha"],
  ["PADRINHO","Padrinho"],["AMIGO","Amigo(a)"],["AGREGADO","Agregado"],["DEPENDENTE","Dependente"],["COLABORADOR","Colaborador"],["EX_CONJUGE","Ex Cônjuge"],["EX_TITULAR","Ex Titular"],["EX_RESPONSAVEL","Ex Responsável"],
];
const PARENTESCO_LABELS = Object.fromEntries(PARENTESCOS_FALLBACK);
const labelParentesco = (v) => PARENTESCO_LABELS[v] || v;

/* ===== estado civil aceito pela API ===== */
const ESTADO_CIVIL_OPTIONS = [
  ["SOLTEIRO","Solteiro(a)"],["CASADO","Casado(a)"],["DIVORCIADO","Divorciado(a)"],
  ["AMASIADO","Amasiado(a)"],["UNIAO_ESTAVEL","União Estável"],["VIUVO","Viúvo(a)"],["SEPARADO","Separado(a)"],
];
const ESTADO_CIVIL_LABEL = Object.fromEntries(ESTADO_CIVIL_OPTIONS);

/* ===== sexo (UI -> API) ===== */
const SEXO_OPTIONS = [
  ["HOMEM","Masculino"],
  ["MULHER","Feminino"],
];
const mapSexoToApi = (v) => (v === "MULHER" ? "MULHER" : v === "HOMEM" ? "HOMEM" : null);

/* =============== helpers =============== */
function useDebouncedCallback(fn, delay=400){
  const t = useRef();
  return (...args)=>{
    if(t.current) clearTimeout(t.current);
    t.current = setTimeout(()=>fn(...args), delay);
  };
}

/* =============== DateSelectBR =============== */
function DateSelectBR({ valueISO, onChangeISO, invalid=false, className="", minAge, maxAge, idPrefix }) {
  const [dia,setDia]=useState(""); const [mes,setMes]=useState(""); const [ano,setAno]=useState("");
  const [softWarn,setSoftWarn]=useState("");
  const hydratedRef = useRef(false);

  useEffect(()=>{
    const m = typeof valueISO === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueISO);
    if(!m) return;
    const [_, yy, mm, dd] = m;
    if(ano!==yy) setAno(yy);
    if(mes!==mm) setMes(mm);
    if(dia!==dd) setDia(dd);
    hydratedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueISO]);

  const today=new Date(); const thisYear=today.getFullYear();

  const minDate = (() => {
    if (typeof maxAge === "number") { const d = new Date(today); d.setFullYear(d.getFullYear() - maxAge); return d; }
    const d = new Date(today); d.setFullYear(thisYear - 100); return d;
  })();
  const maxDate = (() => {
    if (typeof minAge === "number") { const d = new Date(today); d.setFullYear(d.getFullYear() - minAge); return d; }
    return today;
  })();

  const minY=minDate.getFullYear(), maxY=maxDate.getFullYear();
  const anos=useMemo(()=>{ const arr=[]; for(let y=maxY;y>=minY;y--) arr.push(String(y)); return arr; },[minY,maxY]);

  const mesesAll=[["01","Janeiro"],["02","Fevereiro"],["03","Março"],["04","Abril"],["05","Maio"],["06","Junho"],["07","Julho"],["08","Agosto"],["09","Setembro"],["10","Outubro"],["11","Novembro"],["12","Dezembro"]];
  const str2int = (s) => parseInt(s,10) || 0;
  const daysInMonth=(y,m)=>new Date(y,m,0).getDate();

  const mesesFiltrados=useMemo(()=>{ 
    if(!ano) return mesesAll;
    const y=str2int(ano);
    const minM=(y===minY)?(minDate.getMonth()+1):1;
    const maxM=(y===maxY)?(maxDate.getMonth()+1):12;
    return mesesAll.filter(([v])=>{const mm=str2int(v); return mm>=minM && mm<=maxM;});
  },[ano,minY,maxY]);

  function clampMonthIfNeeded(y, m){
    const minM=(y===minY)?(minDate.getMonth()+1):1;
    const maxM=(y===maxY)?(maxDate.getMonth()+1):12;
    if(!m) return m;
    if(m<minM) return minM;
    if(m>maxM) return maxM;
    return m;
  }
  function clampDayIfNeeded(y,m,d){
    if(!y||!m||!d) return d;
    const maxDMonth = daysInMonth(y,m);
    let minD=1, maxD=maxDMonth;
    if(y===minY && m===(minDate.getMonth()+1)) minD=minDate.getDate();
    if(y===maxY && m===(maxDate.getMonth()+1)) maxD=Math.min(maxDMonth,maxDate.getDate());
    if(d<minD) return minD;
    if(d>maxD) return maxD;
    return d;
  }
  function inRange(iso){
    const d=new Date(iso);
    const a=new Date(minDate.getFullYear(),minDate.getMonth(),minDate.getDate());
    const b=new Date(maxDate.getFullYear(),maxDate.getMonth(),maxDate.getDate());
    return !isNaN(d) && d>=a && d<=b;
  }

  useEffect(()=>{ 
    setSoftWarn("");
    if(!(dia && mes && ano)) return;
    const iso=`${ano}-${mes}-${dia}`;
    const ok = inRange(iso);
    if(!ok) setSoftWarn("Data fora do limite permitido para este plano.");
    if(hydratedRef.current && valueISO === iso) return;
    onChangeISO?.(iso);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[dia,mes,ano]);

  function handleChangeAno(nextAnoStr){
    setSoftWarn("");
    const y = str2int(nextAnoStr);
    setAno(nextAnoStr);
    if(!y) return;
    let m = str2int(mes);
    const mClamped = clampMonthIfNeeded(y, m || 0);
    if(m && m !== mClamped){
      setMes(String(mClamped).padStart(2,"0"));
      setSoftWarn("Ajustamos o mês para o limite permitido.");
      m = mClamped;
    }
    if(m){
      const d = str2int(dia);
      if(d){
        const dClamped = clampDayIfNeeded(y, m, d);
        if(dClamped !== d){
          setDia(String(dClamped).padStart(2,"0"));
          setSoftWarn("Ajustamos o dia para o máximo permitido no período.");
        }
      }
    }
  }
  function handleChangeMes(nextMesStr){
    setSoftWarn("");
    setMes(nextMesStr);
    const y = str2int(ano);
    const m = str2int(nextMesStr);
    const d = str2int(dia);
    if(y && m && d){
      const dClamped = clampDayIfNeeded(y,m,d);
      if(dClamped !== d){
        setDia(String(dClamped).padStart(2,"0"));
        setSoftWarn("Ajustamos o dia para o máximo permitido no mês/limite.");
      }
    }
  }

  const idDia  = `${idPrefix || "date"}-dia`;
  const idMes  = `${idPrefix || "date"}-mes`;
  const idAno  = `${idPrefix || "date"}-ano`;

  return (
    <div>
      <div className={`grid grid-cols-3 gap-2 ${invalid?"ring-1 ring-red-500 rounded-md p-1":""} ${className}`}>
        <label htmlFor={idDia} className="sr-only">Dia</label>
        <select id={idDia} className="input h-11" value={dia} onChange={e=>setDia(e.target.value)}>
          <option value="">Dia</option>
          {(() => {
            const y=parseInt(ano||"",10)||0, m=parseInt(mes||"",10)||0;
            let minD=1, maxD=31;
            if(y && m){
              const maxDMonth=daysInMonth(y,m);
              minD=(y===minY && m===(minDate.getMonth()+1)) ? minDate.getDate() : 1;
              maxD=(y===maxY && m===(maxDate.getMonth()+1)) ? Math.min(maxDMonth,maxDate.getDate()) : maxDMonth;
            }
            const arr=[]; for(let d=minD; d<=maxD; d++) arr.push(String(d).padStart(2,"0"));
            return arr.map(d=><option key={d} value={d}>{d}</option>);
          })()}
        </select>

        <label htmlFor={idMes} className="sr-only">Mês</label>
        <select id={idMes} className="input h-11" value={mes} onChange={e=>handleChangeMes(e.target.value)}>
          <option value="">Mês</option>
          {mesesFiltrados.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>

        <label htmlFor={idAno} className="sr-only">Ano</label>
        <select id={idAno} className="input h-11" value={ano} onChange={e=>handleChangeAno(e.target.value)}>
          <option value="">Ano</option>
          {anos.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {(invalid || softWarn) && (
        <p className={`mt-1 text-xs inline-flex items-center gap-1 ${invalid ? "text-red-600" : "text-amber-600"}`} role="alert">
          <AlertTriangle size={14}/> {invalid ? "Idade fora do limite para este plano." : softWarn}
        </p>
      )}
    </div>
  );
}

/* =============== Página =============== */
export default function Cadastro(){
  const q=useQuery(); const navigate=useNavigate();
  const [plano,setPlano]=useState(null); const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const [submitAttempted,setSubmitAttempted]=useState(false);
  const [restoredDraft,setRestoredDraft]=useState(false);
  const [showDraftBadge,setShowDraftBadge]=useState(true);

  const payload=useMemo(()=>decodePayloadParam(q.get("p")),[q]);
  const planoId=payload?.plano; const cupom=payload?.cupom||"";

  const UF_PADRAO=(import.meta?.env?.VITE_UF_PADRAO||window.__UF_PADRAO__||"").toString().toUpperCase().slice(0,2);

  const defaultTitular = {
    nome:"", cpf:"", rg:"", estado_civil:"", sexo:"", data_nascimento:"",
    celular:"", email:"",
    endereco:{cep:"",logradouro:"",numero:"",complemento:"",bairro:"",cidade:"",uf:""}
  };
  const [titular,setTitular]=useState(defaultTitular);
  const [deps,setDeps]=useState([]);

  // controla aviso de navegação com rascunho não enviado
  const isDirtyRef = useRef(false);
  useEffect(()=>{
    const handleBeforeUnload=(e)=>{
      if(isDirtyRef.current && !saving){
        e.preventDefault();
        e.returnValue="";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return ()=>window.removeEventListener("beforeunload", handleBeforeUnload);
  },[saving]);

  // ------- SOMENTE LOCALSTORAGE -------
  const DRAFT_KEY = useMemo(()=>`cadastroDraft:v2:${planoId||"sem-plano"}:${cupom||"no-cupom"}`, [planoId, cupom]);
  const saveTimer = useRef(null);
  const initializedRef = useRef(false);

  // ------- CARREGA PLANO -------
  useEffect(()=>{ (async()=>{
    try{ if(planoId){ const {data}=await api.get(`/api/v1/planos/${planoId}`); setPlano(data);} }
    catch(e){ console.error(e); setError("Falha ao carregar plano."); }
    finally{ setLoading(false); }
  })(); },[planoId]);

  // ------- INICIALIZA (Payload + Draft local) em UMA vez -------
  useEffect(()=>{
    if(initializedRef.current) return;

    // 1) Base a partir do payload (preserva a regra original)
    let nextTitular = { ...defaultTitular };
    let nextDeps = [];
    const qtd=Number(payload?.qtdDependentes||0);
    if(qtd>0){
      nextDeps = Array.from({length:qtd}).map(()=>({nome:"",cpf:"",sexo:"",parentesco:"",data_nascimento:""}));
    }
    if(Array.isArray(payload?.dependentes)){
      payload.dependentes.forEach((d,i)=>{
        if(!nextDeps[i]) nextDeps[i]={nome:"",cpf:"",sexo:"",parentesco:"",data_nascimento:""};
        if(typeof d.parentesco==="string") nextDeps[i].parentesco=d.parentesco||"";
        nextDeps[i].__idade_hint = d.idade ?? undefined;
        if(d.nome) nextDeps[i].nome = d.nome;
      });
    }

    // 2) Merge com draft local
    let usedDraft = false;
    try{
      const raw = localStorage.getItem(DRAFT_KEY);
      if(raw){
        const draft = JSON.parse(raw);
        if(draft && typeof draft==='object'){
          if(draft.titular) nextTitular = { ...nextTitular, ...draft.titular };
          if(Array.isArray(draft.deps) && draft.deps.length){
            const maxLen = Math.max(nextDeps.length, draft.deps.length);
            const merged = [];
            for(let i=0;i<maxLen;i++){
              merged[i] = { ...(nextDeps[i]||{nome:"",cpf:"",sexo:"",parentesco:"",data_nascimento:""}), ...(draft.deps[i]||{}) };
            }
            nextDeps = merged;
          }
          usedDraft = true;
        }
      }
    }catch{}

    setTitular(nextTitular);
    setDeps(nextDeps);
    setRestoredDraft(usedDraft);
    initializedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, DRAFT_KEY]);

  // ------- AUTOSAVE LOCAL (só após init) -------
  const idleSave = (dataStr)=>{
    try{
      if("requestIdleCallback" in window){
        // @ts-ignore
        requestIdleCallback(()=>localStorage.setItem(DRAFT_KEY, dataStr), { timeout: 500 });
      }else{
        localStorage.setItem(DRAFT_KEY, dataStr);
      }
    }catch{}
  };

  useEffect(()=>{
    if(!initializedRef.current) return;
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>{
      try{
        const data = JSON.stringify({ titular, deps, planoId, cupom, ts: Date.now() });
        idleSave(data);
        isDirtyRef.current = true;
      }catch{}
    }, 400);
    return ()=>{ if(saveTimer.current) clearTimeout(saveTimer.current); };
  }, [titular, deps, DRAFT_KEY, planoId, cupom]);

  function clearDraft(){
    try{ localStorage.removeItem(DRAFT_KEY); }catch{}
    setRestoredDraft(false);
    setShowDraftBadge(false);
  }

  // ------- CEP com debounce & cancel -------
  const cepAbortRef = useRef(null);
  const debouncedBuscaCEP = useDebouncedCallback(async (cepRaw, titularSnapshot) => {
    const d=onlyDigits(cepRaw);
    if(d.length!==8) return;
    if(cepAbortRef.current){ cepAbortRef.current.abort(); }
    const controller = new AbortController();
    cepAbortRef.current = controller;
    try{
      const res=await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: controller.signal });
      const data=await res.json();
      if(!data.erro){
        setTitular(t=>({
          ...t,
          endereco:{
            ...t.endereco,
            logradouro: data.logradouro || titularSnapshot.endereco.logradouro,
            bairro: data.bairro || titularSnapshot.endereco.bairro,
            cidade: data.localidade || titularSnapshot.endereco.cidade,
            uf: (data.uf || titularSnapshot.endereco.uf || UF_PADRAO || "").toUpperCase().slice(0,2),
          }
        }));
      }
    }catch{}
  }, 500);

  const parentescosPlano = pick(plano||{},"parentescos") || [];
  const PARENTESCOS_EFFECTIVE = useMemo(
    ()=> Array.isArray(parentescosPlano) && parentescosPlano.length>0
      ? parentescosPlano.map(v=>[v, PARENTESCO_LABELS[v] || v])
      : PARENTESCOS_FALLBACK,
    [parentescosPlano]
  );

  const idadeMinTit=pick(plano||{},"idadeMinimaTitular","idade_minima_titular");
  const idadeMaxTit=pick(plano||{},"idadeMaximaTitular","idade_maxima_titular");
  const idadeMinDep=pick(plano||{},"idadeMinimaDependente","idade_minima_dependente");
  const idadeMaxDep=pick(plano||{},"idadeMaximaDependente","idade_maxima_dependente");

  const baseMensal=useMemo(()=>getMensal(plano),[plano]);
  const numDepsIncl=Number(pick(plano||{},"numeroDependentes","numero_dependentes")||0);
  const valorIncAnual=Number(pick(plano||{},"valorIncremental","valor_incremental")||0);
  const valorIncMensal=useMemo(()=>valorIncAnual/12,[valorIncAnual]);
  const excedentes=Math.max(0, deps.length - numDepsIncl);
  const totalMensal=(baseMensal||0)+excedentes*valorIncMensal;

  const ageFromDate=(iso)=>{ if(!iso) return null; const d=new Date(iso); if(isNaN(d)) return null;
    const t=new Date(); let a=t.getFullYear()-d.getFullYear(); const m=t.getMonth()-d.getMonth();
    if(m<0 || (m===0 && t.getDate()<d.getDate())) a--; return a;
  };
  const titularAge=ageFromDate(titular.data_nascimento);
  const titularForaLimite = titular.data_nascimento && (
    (Number.isFinite(idadeMinTit)&&titularAge<idadeMinTit) ||
    (Number.isFinite(idadeMaxTit)&&titularAge>idadeMaxTit)
  );

  const depsIssues = deps.map(d=>{
    const age=ageFromDate(d.data_nascimento);
    const fora=d.data_nascimento && (
      (Number.isFinite(idadeMinDep)&&age<idadeMinDep) ||
      (Number.isFinite(idadeMaxDep)&&age>idadeMaxDep)
    );
    const parentescoVazio = Boolean((d.nome||"").trim()) && !d.parentesco;
    const cpfInvalido = Boolean((d.cpf||"").trim()) && !cpfIsValid(d.cpf);
    return { fora, age, parentescoVazio, cpfInvalido };
  });
  const countDepsFora=depsIssues.filter(x=>x.fora).length;

  const updTit=(patch)=>setTitular(t=>({...t,...patch}));
  const updTitEndereco=(patch)=>setTitular(t=>({...t,endereco:{...t.endereco,...patch}}));
  const updDep=(i,patch)=>setDeps(prev=>prev.map((d,idx)=>idx===i?{...d,...patch}:d));
  const addDep=()=>setDeps(prev=>[...prev,{nome:"",cpf:"",sexo:"",parentesco:"",data_nascimento:""}]);
  const delDep=(i)=>setDeps(prev=>prev.filter((_,idx)=>idx!==i));

  // UX: regras simples de obrigatoriedade para liberar o envio
  const nomeOk = (titular.nome || "").trim().length >= 3;
  const cpfOk = cpfIsValid(titular.cpf);
  const celularOk = phoneIsValid(titular.celular);
  const titularDataOk = !titularForaLimite && Boolean(titular.data_nascimento);
  const depsParentescosOk = depsIssues.every(di=>!di.parentescoVazio);
  const depsDatasOk = depsIssues.every(di=>!di.fora);
  const depsCpfsOk = depsIssues.every(di=>!di.cpfInvalido);
  const formInvalid = !(nomeOk && cpfOk && celularOk && titularDataOk && depsParentescosOk && depsDatasOk && depsCpfsOk);

  async function handleSalvarEnviar(){
    setSubmitAttempted(true);
    if(formInvalid){
      setError("Revise os campos destacados antes de continuar.");
      return;
    }
    setSaving(true); setError("");
    try{
      // 1) TITULAR -> /pessoas
      const e = titular.endereco || {};
      const bodyPessoa = {
        nome: (titular.nome || "").trim(),
        cpf: titular.cpf,
        rg: (titular.rg || null),
        dataNascimento: titular.data_nascimento || null,
        sexo: mapSexoToApi(titular.sexo), // "HOMEM" | "MULHER" | null
        estadoCivil: titular.estado_civil || null,
        contatos: {
          email: (titular.email || null),
          celular: titular.celular ? onlyDigits(titular.celular) : null,
          telefone: null
        },
        endereco: {
          cep: e.cep || null,
          cidade: e.cidade || null,
          uf: (e.uf || "").toUpperCase().slice(0,2) || null,
          bairro: e.bairro || null,
          logradouro: e.logradouro || null,
          numero: e.numero || null,
          complemento: e.complemento || null
        }
      };

      const pessoaRes = await api.post("/api/v1/pessoas", bodyPessoa).catch(err=>{
        console.error("POST /pessoas falhou", err?.response?.status, err?.response?.data, bodyPessoa);
        throw err;
      });
      const titularId = pessoaRes?.data?.id || pessoaRes?.data?.pessoaId || pessoaRes?.data?.uuid;
      if(!titularId) throw new Error("Não foi possível obter o ID do titular.");

      // 2) DEPENDENTES -> /dependentes (apenas os que tiverem nome) (sequencial para melhor log)
      const depsToCreate = deps
        .filter(d => (d.nome || "").trim().length >= 3)
        .map(d => ({
          cpf: d.cpf ? onlyDigits(d.cpf) : null,
          nome: (d.nome || "").trim(),
          email: null,
          fone: null,
          celular: null,
          parentesco: d.parentesco || null,
          sexo: mapSexoToApi(d.sexo),
          dataNascimento: d.data_nascimento || null,
          titularId: titularId,
          apelido: null,
          estadoCivil: null
        }));

      for (const payload of depsToCreate) {
        try {
          await api.post("/api/v1/dependentes", payload);
        } catch (err) {
          console.error("POST /dependentes falhou", err?.response?.status, err?.response?.data, payload);
          throw err;
        }
      }

      // 3) CONTRATO -> /contratos
      const todayISO = new Date().toISOString().slice(0,10);
      const pickSafeDiaD = () => {
        const d = new Date().getDate();
        return Math.max(1, Math.min(28, d)); // seguro 1..28
      };
      const contratoBody = {
        titularId: Number(titularId),
        planoId: Number(planoId),
        vendedorId: 717,
        dataContrato: todayISO,
        diaD: pickSafeDiaD()
      };

      const contratoRes = await api.post("/api/v1/contratos", contratoBody).catch(err=>{
        console.error("POST /contratos falhou", err?.response?.status, err?.response?.data, contratoBody);
        throw err;
      });
      const contratoId = contratoRes?.data?.id || contratoRes?.data?.contratoId || contratoRes?.data?.uuid;

      // limpar rascunho ao concluir
      try{ localStorage.removeItem(DRAFT_KEY); }catch{}
      isDirtyRef.current = false;

      navigate(`/confirmacao?contrato=${contratoId||""}&titular=${titularId}`);
    }catch(e){
      console.error(e);
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || "";
      setError(msg ? `Não foi possível concluir pelo site: ${msg}` : "Não foi possível concluir pelo site. Você pode enviar por WhatsApp.");
    }finally{ setSaving(false); }
  }

  function sexoLabelFromValue(v){
    return (SEXO_OPTIONS.find(([val])=>val===v)?.[1]) || "";
  }

  function sendWhatsFallback(){
    const numero=(import.meta?.env?.VITE_WHATSAPP||window.__WHATSAPP__)||"";
    const L=[];
    L.push("*Solicitação de Contratação*\n");
    L.push(`Plano: ${plano?.nome||planoId}`);
    L.push(`Valor base: ${money(baseMensal)} | Total mensal: ${money(totalMensal)}`);
    if(cupom) L.push(`Cupom: ${cupom}`);
    L.push("\n*Titular*:");
    L.push(`Nome: ${titular.nome||""}`);
    L.push(`CPF: ${titular.cpf||""}`);
    L.push(`Sexo: ${sexoLabelFromValue(titular.sexo)}`);
    L.push(`Celular: ${titular.celular||""}`);
    L.push(`E-mail: ${titular.email||"(não informado)"}`);
    L.push(`RG: ${titular.rg||""}`);
    L.push(`Estado civil: ${ESTADO_CIVIL_LABEL[titular.estado_civil]||titular.estado_civil||""}`);
    L.push(`Nascimento: ${titular.data_nascimento||""}`);
    const e=titular.endereco||{};
    L.push(`End.: ${e.logradouro||""}, ${e.numero||""} ${e.complemento||""} - ${e.bairro||""}`);
    L.push(`${e.cidade||""}/${e.uf||""} - CEP ${e.cep||""}`);
    L.push("\n*Dependentes*:");
    if(!deps.length) L.push("(Nenhum)");
    deps.forEach((d,i)=>L.push(`${i+1}. ${d.nome||"(sem nome)"} - ${labelParentesco(d.parentesco)} - ${sexoLabelFromValue(d.sexo)} - CPF: ${d.cpf||"(não informado)"} - nasc.: ${d.data_nascimento||""}`));
    openWhatsApp(numero, L.join("\n"));
  }

  if(loading){
    return (
      <section className="section" aria-busy="true" aria-live="polite">
        <div className="container-max space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg=[var(--c-surface)]"/>
          <div className="h-24 rounded-2xl animate-pulse bg-[var(--c-surface)]"/>
          <div className="h-24 rounded-2xl animate-pulse bg-[var(--c-surface)]"/>
        </div>
      </section>
    );
  }
  if(!payload || !planoId){
    return (
      <section className="section">
        <div className="container-max">
          <p className="mb-3 font-medium">Não encontramos os dados da simulação.</p>
          <CTAButton onClick={()=>navigate(-1)}>Voltar</CTAButton>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-max">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={()=>navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)]"
            aria-label="Voltar para a página anterior"
          >
            <ChevronLeft size={16}/> Voltar
          </button>

          {restoredDraft && showDraftBadge && (
            <span className="ml-2 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-[var(--c-border)] text-[var(--c-muted)]">
              Rascunho restaurado deste dispositivo
              <button
                className="opacity-70 hover:opacity-100"
                onClick={()=>setShowDraftBadge(false)}
                aria-label="Ocultar aviso de rascunho restaurado"
                title="Ocultar"
              >
                <X size={12}/>
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearDraft}
            className="ml-auto text-xs underline text-[var(--c-muted)] hover:opacity-80"
            title="Apagar rascunho salvo automaticamente"
          >
            Apagar rascunho
          </button>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <h1 className="text-2xl font-extrabold tracking-tight">Cadastro</h1>
            <p className="mt-1 text-sm text-[var(--c-muted)]">
              Plano <b>{plano?.nome||""}</b> — Base mensal {money(getMensal(plano))}
            </p>

            {/* Titular */}
            <div className="mt-6">
              <h2 className="font-semibold text-lg">Titular</h2>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className="label" htmlFor="titular-nome">Nome completo</label>
                  <input
                    id="titular-nome"
                    className={`input h-11 w-full ${submitAttempted && !(titular.nome||"").trim() ? "ring-1 ring-red-500" : ""}`}
                    value={titular.nome}
                    onChange={e=>updTit({nome:e.target.value})}
                    placeholder="Como está no documento"
                    autoComplete="name"
                    aria-invalid={submitAttempted && !(titular.nome||"").trim() ? "true" : "false"}
                  />
                  {submitAttempted && !(titular.nome||"").trim() && <p className="text-xs text-red-600 mt-1">Informe o nome completo.</p>}
                </div>

                {/* Linha 1 — CPF, RG, Estado Civil, Sexo */}
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <label className="label" htmlFor="titular-cpf">CPF</label>
                    <input
                      id="titular-cpf"
                      className={`input h-11 w-full ${titular.cpf && !cpfIsValid(titular.cpf) ? "ring-1 ring-red-500" : ""}`}
                      inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
                      value={formatCPF(titular.cpf)} onChange={e=>updTit({cpf:maskCPF(e.target.value)})}
                      autoComplete="off"
                      aria-invalid={titular.cpf && !cpfIsValid(titular.cpf) ? "true" : "false"}
                    />
                    {titular.cpf && !cpfIsValid(titular.cpf) && <p className="text-xs text-red-600 mt-1">CPF inválido.</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="label" htmlFor="titular-rg">RG</label>
                    <input id="titular-rg" className="input h-11 w-full" value={titular.rg} onChange={e=>updTit({rg:e.target.value})} placeholder="RG" autoComplete="off"/>
                  </div>

                  <div className="md:col-span-3">
                    <label className="label" htmlFor="titular-ec">Estado civil</label>
                    <select id="titular-ec" className="input h-11 w-full" value={titular.estado_civil} onChange={e=>updTit({estado_civil:e.target.value})}>
                      <option value="">Selecione…</option>
                      {ESTADO_CIVIL_OPTIONS.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="label" htmlFor="titular-sexo">Sexo</label>
                    <select id="titular-sexo" className="input h-11 w-full" value={titular.sexo} onChange={e=>updTit({sexo:e.target.value})}>
                      <option value="">Selecione…</option>
                      {SEXO_OPTIONS.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
                    </select>
                  </div>
                </div>

                {/* Linha 2 — Data de Nascimento, Celular e E-mail */}
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <label className="label">Data de nascimento</label>
                    <DateSelectBR
                      className="w-full"
                      idPrefix="titular-nasc"
                      valueISO={titular.data_nascimento}
                      onChangeISO={(iso)=>updTit({data_nascimento:iso})}
                      invalid={Boolean(submitAttempted && (titularForaLimite || !titular.data_nascimento))}
                      minAge={Number.isFinite(idadeMinTit)?Number(idadeMinTit):undefined}
                      maxAge={Number.isFinite(idadeMaxTit)?Number(idadeMaxTit):undefined}
                    />
                    {submitAttempted && (!titular.data_nascimento || titularForaLimite) && (
                      <p className="text-xs text-red-600 mt-1">Verifique a data dentro do limite do plano.</p>
                    )}
                  </div>

                  <div className="md:col-span-4">
                    <label className="label" htmlFor="titular-cel">Celular (obrigatório)</label>
                    <input
                      id="titular-cel"
                      className={`input h-11 w-full ${submitAttempted && !phoneIsValid(titular.celular) ? "ring-1 ring-red-500" : ""}`}
                      inputMode="tel" placeholder="(11) 9XXXX-XXXX"
                      value={formatPhoneBR(titular.celular)} onChange={e=>updTit({celular:maskPhone(e.target.value)})}
                      autoComplete="tel-national"
                      aria-invalid={submitAttempted && !phoneIsValid(titular.celular) ? "true" : "false"}
                    />
                    {submitAttempted && !phoneIsValid(titular.celular) && <p className="text-xs text-red-600 mt-1">Informe um celular válido.</p>}
                  </div>

                  <div className="md:col-span-4">
                    <label className="label" htmlFor="titular-email">E-mail (opcional)</label>
                    <input
                      id="titular-email"
                      className="input h-11 w-full"
                      type="email" placeholder="seu@email.com"
                      value={titular.email} onChange={e=>updTit({email:e.target.value})}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 md:grid-cols-[180px,1fr,140px]">
                  <div>
                    <label className="label" htmlFor="end-cep">CEP</label>
                    <input
                      id="end-cep"
                      className="input h-11"
                      inputMode="numeric" maxLength={9}
                      value={formatCEP(titular.endereco.cep)}
                      onChange={e=>{
                        const v=maskCEP(e.target.value);
                        updTitEndereco({cep:v});
                        debouncedBuscaCEP(v, titular);
                      }}
                      placeholder="00000-000"
                      autoComplete="postal-code"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="end-log">Logradouro</label>
                    <input id="end-log" className="input h-11" value={titular.endereco.logradouro} onChange={e=>updTitEndereco({logradouro:e.target.value})} autoComplete="address-line1"/>
                  </div>
                  <div>
                    <label className="label" htmlFor="end-num">Número</label>
                    <input id="end-num" className="input h-11" value={titular.endereco.numero} onChange={e=>updTitEndereco({numero:e.target.value})} autoComplete="address-line2"/>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,100px]">
                  <div>
                    <label className="label" htmlFor="end-comp">Complemento</label>
                    <input id="end-comp" className="input h-11" value={titular.endereco.complemento} onChange={e=>updTitEndereco({complemento:e.target.value})}/>
                  </div>
                  <div>
                    <label className="label" htmlFor="end-bairro">Bairro</label>
                    <input id="end-bairro" className="input h-11" value={titular.endereco.bairro} onChange={e=>updTitEndereco({bairro:e.target.value})}/>
                  </div>
                  <div>
                    <label className="label" htmlFor="end-cidade">Cidade</label>
                    <input
                      id="end-cidade"
                      className="input h-11"
                      value={titular.endereco.cidade}
                      onChange={e=>{
                        const cidade=e.target.value;
                        const uf=titular.endereco.uf || UF_PADRAO || "";
                        updTitEndereco({ cidade, uf });
                      }}
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="end-uf">UF</label>
                    <input
                      id="end-uf"
                      className="input h-11"
                      value={titular.endereco.uf}
                      onChange={e=>{
                        const v=e.target.value.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,2);
                        updTitEndereco({ uf:v });
                      }}
                      maxLength={2}
                      autoComplete="address-level1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dependentes */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Dependentes ({deps.length})</h2>
                <CTAButton onClick={addDep} className="h-10"><Plus size={16} className="mr-2"/>Adicionar</CTAButton>
              </div>

              <div className="mt-4 grid gap-4">
                {deps.map((d,i)=>{
                  const issue=depsIssues[i];
                  const showParentescoError = submitAttempted && issue?.parentescoVazio;
                  return (
                    <div key={i} className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">Dependente {i+1}</span>
                        <CTAButton variant="ghost" onClick={()=>delDep(i)} className="h-9 px-3" aria-label={`Remover dependente ${i+1}`}>
                          <Trash2 size={16} className="mr-2"/> Remover
                        </CTAButton>
                      </div>

                      {/* Linha 1 */}
                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <label className="label">Nome completo</label>
                          <input className="input h-11 w-full" placeholder="Nome do dependente" value={d.nome} onChange={e=>updDep(i,{nome:e.target.value})}/>
                        </div>
                        <div className="md:col-span-3">
                          <label className="label">Parentesco</label>
                          <select
                            className={`input h-11 w-full ${showParentescoError?"ring-1 ring-red-500":""}`}
                            value={d.parentesco}
                            onChange={e=>updDep(i,{parentesco:e.target.value})}
                          >
                            <option value="">Selecione…</option>
                            {(PARENTESCOS_EFFECTIVE||[]).map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
                          </select>
                          {showParentescoError && <p className="text-xs text-red-600 mt-1">Selecione o parentesco.</p>}
                        </div>
                        <div className="md:col-span-3">
                          <label className="label">Sexo</label>
                          <select
                            className="input h-11 w-full"
                            value={d.sexo||""}
                            onChange={e=>updDep(i,{sexo:e.target.value})}
                          >
                            <option value="">Selecione…</option>
                            {SEXO_OPTIONS.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
                          </select>
                        </div>
                      </div>

                      {/* Linha 2 */}
                      <div className="grid gap-3 md:grid-cols-12 mt-2">
                        <div className="md:col-span-6">
                          <label className="label">CPF (opcional)</label>
                          <input
                            className={`input h-11 w-full ${(d.cpf && !cpfIsValid(d.cpf)) ? "ring-1 ring-red-500" : ""}`}
                            inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
                            value={formatCPF(d.cpf||"")} onChange={e=>updDep(i,{cpf:maskCPF(e.target.value)})}
                          />
                          {(d.cpf && !cpfIsValid(d.cpf)) && <p className="text-xs text-red-600 mt-1">CPF inválido.</p>}
                        </div>
                        <div className="md:col-span-6">
                          <label className="label">Data de nascimento</label>
                          <DateSelectBR
                            className="w-full"
                            idPrefix={`dep-${i}-nasc`}
                            valueISO={d.data_nascimento}
                            onChangeISO={(iso)=>updDep(i,{data_nascimento:iso})}
                            invalid={Boolean(submitAttempted && issue?.fora)}
                            minAge={Number.isFinite(idadeMinDep)?Number(idadeMinDep):undefined}
                            maxAge={Number.isFinite(idadeMaxDep)?Number(idadeMaxDep):undefined}
                          />
                          {d.__idade_hint && !d.data_nascimento && (
                            <p className="text-xs text-[var(--c-muted)] mt-2">Dica: aproximadamente {d.__idade_hint} anos.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <CTAButton onClick={addDep} className="w-full h-11 justify-center">
                  <Plus size={16} className="mr-2"/> Adicionar dependente
                </CTAButton>
              </div>

              {countDepsFora>0 && (
                <p className="mt-2 text-xs inline-flex items-center gap-1 text-red-600" role="alert">
                  <AlertTriangle size={14}/> {countDepsFora} dependente(s) fora do limite etário do plano.
                </p>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <CTAButton onClick={handleSalvarEnviar} disabled={saving || formInvalid} className="h-12 w-full" aria-disabled={saving || formInvalid}>
                {saving ? "Enviando…" : "Salvar e continuar"}
              </CTAButton>
              <CTAButton variant="outline" onClick={sendWhatsFallback} className="h-12 w-full" title="Enviar cadastro por WhatsApp">
                <MessageCircle size={16} className="mr-2"/> Enviar por WhatsApp
              </CTAButton>
            </div>

            <p className="mt-3 text-xs text-[var(--c-muted)] inline-flex items-center gap-1">
              <CheckCircle2 size={14}/> Seus dados são salvos automaticamente neste dispositivo.
            </p>
          </div>

          {/* Resumo no final */}
          <div className="p-6 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--c-muted)]">Plano</span><span className="font-medium text-right">{plano?.nome}</span></div>
              <div className="flex justify-between"><span className="text-[var(--c-muted)]">Base mensal</span><span>{money(baseMensal)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--c-muted)]">Incluídos no plano</span><span>{numDepsIncl}</span></div>
              <div className="flex justify-between"><span className="text-[var(--c-muted)]">Dependentes adicionais ({excedentes}) × {money(valorIncMensal)}</span><span>{money(excedentes*valorIncMensal)}</span></div>
              <hr className="my-2"/>
              <div className="flex justify-between font-semibold text-base">
                <span>Total mensal</span><span className="text-[color:var(--primary)] font-extrabold">{money(totalMensal)}</span>
              </div>
              {cupom ? (<div className="flex justify-between"><span className="text-[var(--c-muted)]">Cupom</span><span className="font-medium">{cupom}</span></div>) : null}
            </div>
          </div>
        </div>
      </div>

      {/* mobile sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-surface)] md:hidden"
           style={{ paddingBottom:'calc(0.75rem + env(safe-area-inset-bottom))', boxShadow:'0 -12px 30px rgba(0,0,0,.12)' }}>
        <div className="mx-auto max-w-7xl px-3 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-[var(--c-muted)] leading-tight">Total mensal</p>
            <p className="text-xl font-extrabold leading-tight">{money(totalMensal)}</p>
          </div>
          <CTAButton className="min-w-[44%] h-12" onClick={handleSalvarEnviar} disabled={saving || formInvalid} aria-disabled={saving || formInvalid}>
            {saving ? "Enviando…" : "Continuar"}
          </CTAButton>
        </div>
      </div>
      <div className="h-16 md:hidden" aria-hidden/>
    </section>
  );
}
