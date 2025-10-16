// src/pages/Cadastro.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js"; // ✅ voltou o import da API
import CTAButton from "@/components/ui/CTAButton";
import { money } from "@/lib/planUtils.js";
import { CheckCircle2, ChevronLeft, AlertTriangle, MessageCircle, Plus, Trash2, X } from "lucide-react";
import useAuth from "@/store/auth";

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

/* ===== parentescos fallback ===== */
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
const sanitizeUF = (v="") => v.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,2);

/* ========= Prefill do REGISTRO (state, query, storage) ========= */
function extractRegistroPrefill({ q, locationState }) {
  // 1) via state
  const fromState = locationState?.registro || locationState?.prefill;
  if (fromState && typeof fromState === "object") return fromState;

  // 2) via query (?registro= / ?reg= / ?prefill=) — base64 ou json
  const maybeParam = q.get("registro") || q.get("reg") || q.get("prefill");
  const fromQuery = maybeParam ? decodePayloadParam(maybeParam) : null;
  if (fromQuery && typeof fromQuery === "object") return fromQuery;

  // 3) via sessionStorage (canônico no fluxo pós-registro)
  try {
    const raw = sessionStorage.getItem("reg_prefill");
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") return obj;
    }
  } catch {}

  // 4) fallback opcional: localStorage
  try {
    const raw = localStorage.getItem("register:last");
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") return obj;
    }
  } catch {}

  return null;
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
    if(!ok) setSoftWarn("Data fora do limite permitido.");
    if(hydratedRef.current && valueISO === iso) return;
    onChangeISO?.(iso);
  },[dia,mes,ano]);

  function handleChangeAno(nextAnoStr){
    setSoftWarn("");
    const y = parseInt(nextAnoStr,10)||0;
    setAno(nextAnoStr);
    if(!y) return;
    let m = parseInt(mes,10)||0;
    const mClamped = clampMonthIfNeeded(y, m || 0);
    if(m && m !== mClamped){
      setMes(String(mClamped).padStart(2,"0"));
      setSoftWarn("Ajustamos o mês para o limite permitido.");
      m = mClamped;
    }
    if(m){
      const d = parseInt(dia,10)||0;
      if(d){
        const dClamped = clampDayIfNeeded(y, m, d);
        if(dClamped !== d){
          setDia(String(dClamped).padStart(2,"0"));
          setSoftWarn("Ajustamos o dia para o máximo permitido.");
        }
      }
    }
  }
  function handleChangeMes(nextMesStr){
    setSoftWarn("");
    setMes(nextMesStr);
    const y = parseInt(ano,10)||0;
    const m = parseInt(nextMesStr,10)||0;
    const d = parseInt(dia,10)||0;
    if(y && m && d){
      const dClamped = clampDayIfNeeded(y,m,d);
      if(dClamped !== d){
        setDia(String(dClamped).padStart(2,"0"));
        setSoftWarn("Ajustamos o dia para o máximo permitido no mês.");
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
        <p className={`mt-1 text-xs inline-flex items-center gap-1 ${invalid ? "text-red-600" : "text-amber-600"}`} role="alert" aria-live="polite">
          <AlertTriangle size={14}/> {invalid ? "Idade fora do limite." : softWarn}
        </p>
      )}
    </div>
  );
}

/* =============== Página =============== */
export default function Cadastro(){
  const q=useQuery(); const navigate=useNavigate();
  const location = useLocation();
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const [submitAttempted,setSubmitAttempted]=useState(false);

  // ✅ Novo: sumário de erros e foco (UX igual ao RegisterPage)
  const [errorList, setErrorList] = useState([]);
  const alertRef = useRef(null);
  const nomeRef = useRef(null);
  const cpfRef = useRef(null);
  const sexoRef = useRef(null);
  const celRef = useRef(null);
  const nascDiaRef = useRef(null); // foco no primeiro select (dia) da data
  const cepRef = useRef(null);

  const [restoredDraft,setRestoredDraft]=useState(false);
  const [showDraftBadge,setShowDraftBadge]=useState(true);

  const payload=useMemo(()=>decodePayloadParam(q.get("p")),[q]);
  const planoId=payload?.plano;
  const cupom=payload?.cupom||"";
  const plano = payload?.planSnapshot || null;

  const UF_PADRAO=(import.meta?.env?.VITE_UF_PADRAO||window.__UF_PADRAO__||"").toString().toUpperCase().slice(0,2);

  const defaultTitular = {
    nome:"", cpf:"", rg:"", estado_civil:"", sexo:"", data_nascimento:"",
    celular:"", email:"",
    endereco:{cep:"",logradouro:"",numero:"",complemento:"",bairro:"",cidade:"",uf:""}
  };
  const [titular,setTitular]=useState(defaultTitular);
  const [deps,setDeps]=useState([]);

  const authUser = useAuth(s => s.user);

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

  const DRAFT_KEY = useMemo(()=>`cadastroDraft:v2:${planoId||"sem-plano"}:${cupom||"no-cupom"}`, [planoId, cupom]);
  const saveTimer = useRef(null);
  const initializedRef = useRef(false);

  // ------- INICIALIZA (Payload + Draft local + Prefill de registro) -------
  useEffect(()=>{
    if(initializedRef.current) return;

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

    // 🔹 Prefill vindo do REGISTRO (state, query, session/localStorage)
    const regPrefill = extractRegistroPrefill({ q, locationState: location?.state });
    if (regPrefill) {
      const cpf = regPrefill.cpf || regPrefill.documento || "";
      const celular = regPrefill.celular || regPrefill.telefone || regPrefill.phone || "";
      const dataNasc = regPrefill.dataNascimento || regPrefill.nascimento || "";
      nextTitular.cpf = nextTitular.cpf || cpf || "";
      nextTitular.celular = nextTitular.celular || celular || "";
      nextTitular.data_nascimento = nextTitular.data_nascimento || dataNasc || "";
    }

    // (mantém o resto do seu código de rascunho/draft)
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

    // limpa o session flag após uso (se existir)
    try { sessionStorage.removeItem("reg_prefill"); } catch {}
  }, [payload, DRAFT_KEY, q, location?.state]);

  // ------- AUTOPREENCHER (usuário logado) -------
  useEffect(()=>{
    if(!initializedRef.current) return;
    if(!authUser) return;
    setTitular(prev => {
      const addr = authUser.endereco || authUser.address || {};
      return {
        ...prev,
        nome: (prev.nome||"").trim() ? prev.nome : (authUser.nome || authUser.nomeCompleto || authUser.fullName || ""),
        email: (prev.email||"").trim() ? prev.email : (authUser.email || ""),
        cpf: (prev.cpf||"").trim() ? prev.cpf : (authUser.cpf || ""),
        celular: (prev.celular||"").trim() ? prev.celular : (authUser.celular || authUser.telefone || authUser.phone || ""),
        data_nascimento: (prev.data_nascimento||"").trim() ? prev.data_nascimento : (authUser.dataNascimento || authUser.nascimento || ""),
        endereco: {
          cep: (prev.endereco?.cep||"").trim() ? prev.endereco.cep : (addr.cep || ""),
          logradouro: (prev.endereco?.logradouro||"").trim() ? prev.endereco.logradouro : (addr.logradouro || addr.street || ""),
          numero: (prev.endereco?.numero||"").trim() ? prev.endereco.numero : (addr.numero || addr.number || ""),
          complemento: (prev.endereco?.complemento||"").trim() ? prev.endereco.complemento : (addr.complemento || addr.complement || ""),
          bairro: (prev.endereco?.bairro||"").trim() ? prev.endereco.bairro : (addr.bairro || addr.district || ""),
          cidade: (prev.endereco?.cidade||"").trim() ? prev.endereco.cidade : (addr.cidade || addr.city || ""),
          uf: (prev.endereco?.uf||"").trim()
            ? sanitizeUF(prev.endereco.uf)
            : (sanitizeUF(addr.uf || addr.state || "") || UF_PADRAO || ""),
        }
      };
    });
    isDirtyRef.current = true;
  }, [authUser, UF_PADRAO]);

  // ------- AUTOSAVE -------
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

  /* ===== ViaCEP ===== */
  const cepAbortRef = useRef(null);
  const [cepState, setCepState] = useState({ loading:false, error:"", found:false, lastCep:"" });
  const [addressTouched, setAddressTouched] = useState({ logradouro:false, bairro:false, cidade:false, uf:false });

  const setAddrTouched = (patch)=> setAddressTouched(prev=>({ ...prev, ...patch }));

  const applyViaCepData = (data, titularSnapshot) => {
    setTitular(t=>({
      ...t,
      endereco:{
        ...t.endereco,
        logradouro: addressTouched.logradouro ? t.endereco.logradouro : (data.logradouro || titularSnapshot.endereco.logradouro),
        bairro: addressTouched.bairro ? t.endereco.bairro : (data.bairro || titularSnapshot.endereco.bairro),
        cidade: addressTouched.cidade ? t.endereco.cidade : (data.localidade || titularSnapshot.endereco.cidade),
        uf: addressTouched.uf ? sanitizeUF(t.endereco.uf) : sanitizeUF(data.uf || titularSnapshot.endereco.uf || UF_PADRAO || ""),
      }
    }));
  };

  const fetchCEP = async (cepRaw, titularSnapshot) => {
    const d=onlyDigits(cepRaw);
    if(d.length!==8){
      setCepState({ loading:false, error: d.length>0 ? "CEP deve ter 8 dígitos." : "", found:false, lastCep: d });
      return;
    }
    if(cepAbortRef.current){ cepAbortRef.current.abort(); }
    const controller = new AbortController();
    cepAbortRef.current = controller;

    setCepState({ loading:true, error:"", found:false, lastCep:d });
    try{
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: controller.signal });
      if(!res.ok) throw new Error(`Erro ao consultar CEP (${res.status})`);
      const data = await res.json();

      if(data?.erro){
        setCepState({ loading:false, error:"CEP não encontrado.", found:false, lastCep:d });
        return;
      }
      applyViaCepData(data, titularSnapshot);
      setCepState({ loading:false, error:"", found:true, lastCep:d });
    }catch(err){
      if(err?.name === "AbortError") return;
      setCepState({ loading:false, error:"Falha ao consultar CEP. Tente novamente.", found:false, lastCep:d });
    }
  };

  const debouncedBuscaCEP = useDebouncedCallback((cepRaw, titularSnapshot) => {
    fetchCEP(cepRaw, titularSnapshot);
  }, 500);

  // --------- Valores vindos do snapshot ----------
  const baseMensal = Number(plano?.mensal || 0);
  const numDepsIncl = Number(plano?.numeroDependentes || 0);
  const valorIncAnual = Number(plano?.valorIncremental || 0);
  const valorIncMensal = valorIncAnual / 12;
  const excedentes=Math.max(0, deps.length - numDepsIncl);
  const totalMensal=(baseMensal||0)+excedentes*valorIncMensal;

  // idade: titular (fallback 18..100)
  const ageFromDate=(iso)=>{ if(!iso) return null; const d=new Date(iso); if(isNaN(d)) return null;
    const t=new Date(); let a=t.getFullYear()-d.getFullYear(); const m=t.getMonth()-d.getMonth();
    if(m<0 || (m===0 && t.getDate()<d.getDate())) a--; return a;
  };
  const titularAge=ageFromDate(titular.data_nascimento);
  const titularMin = Number.isFinite(plano?.idadeMinimaTitular) ? Number(plano.idadeMinimaTitular) : 18;
  const titularMax = Number.isFinite(plano?.idadeMaximaTitular) ? Number(plano.idadeMaximaTitular) : 100;
  const titularForaLimite = titular.data_nascimento && (
    (Number.isFinite(titularMin)&&titularAge<titularMin) ||
    (Number.isFinite(titularMax)&&titularAge>titularMax)
  );

  const idadeMinDep = Number.isFinite(plano?.idadeMinimaDependente) ? Number(plano.idadeMinimaDependente) : undefined;
  const idadeMaxDep = Number.isFinite(plano?.idadeMaximaDependente) ? Number(plano.idadeMaximaDependente) : undefined;

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

  // regras para liberar envio (só usadas para feedback; não desabilitamos mais o botão)
  const nomeOk = (titular.nome || "").trim().length >= 3;
  const cpfOk = cpfIsValid(titular.cpf);
  const celularOk = phoneIsValid(titular.celular);
  const sexoOk = Boolean(titular.sexo);
  const titularDataOk = !titularForaLimite && Boolean(titular.data_nascimento);
  const depsParentescosOk = depsIssues.every(di=>!di.parentescoVazio);
  const depsDatasOk = depsIssues.every(di=>!di.fora);
  const depsCpfsOk = depsIssues.every(di=>!di.cpfInvalido);
  const formInvalid = !(nomeOk && cpfOk && celularOk && sexoOk && titularDataOk && depsParentescosOk && depsDatasOk && depsCpfsOk);

  // ====== UX: Sumário de erros (igual ao RegisterPage) ======
  function buildErrorList() {
    const items = [];
    if (!nomeOk) items.push({ field: "nome", label: "Informe o nome completo (mín. 3 caracteres)." });
    if (!cpfOk) items.push({ field: "cpf", label: "Digite um CPF válido (11 dígitos)." });
    if (!celularOk) items.push({ field: "celular", label: "Informe um celular válido com DDD." });
    if (!sexoOk) items.push({ field: "sexo", label: "Selecione o sexo." });
    if (!titularDataOk) items.push({ field: "nascimento", label: `Data de nascimento inválida (entre ${titularMin} e ${titularMax} anos).` });

    deps.forEach((d, i) => {
      const issue = depsIssues[i];
      if ((d.nome||"").trim() && issue?.parentescoVazio) items.push({ field: `dep-${i}-parentesco`, label: `Dependente ${i+1}: selecione o parentesco.` });
      if (d.cpf && issue?.cpfInvalido) items.push({ field: `dep-${i}-cpf`, label: `Dependente ${i+1}: CPF inválido.` });
      if (issue?.fora) items.push({ field: `dep-${i}-nasc`, label: `Dependente ${i+1}: data fora do limite etário do plano.` });
    });

    // CEP só se usuário digitou algo inválido
    const cepDigits = onlyDigits(titular.endereco?.cep||"");
    if (cepDigits && cepDigits.length !== 8) items.push({ field: "cep", label: "CEP deve ter 8 dígitos." });
    if (cepState.error) items.push({ field: "cep", label: cepState.error });

    return items;
  }

  function focusByField(field) {
    const map = {
      nome: nomeRef,
      cpf: cpfRef,
      sexo: sexoRef,
      celular: celRef,
      nascimento: nascDiaRef,
      cep: cepRef,
    };
    if (map[field]?.current) {
      map[field].current.focus();
      return;
    }
    // Dependentes
    const isDep = field.startsWith("dep-");
    if (isDep) {
      const el = document.getElementById(field);
      if (el) el.focus();
    }
  }

  useEffect(() => {
    if (submitAttempted && errorList.length > 0) {
      setTimeout(() => {
        alertRef.current?.focus();
        focusByField(errorList[0].field);
      }, 0);
    }
  }, [submitAttempted, errorList]);

  async function handleSalvarEnviar(){
    setSubmitAttempted(true);
    setError("");
    const list = buildErrorList();
    setErrorList(list);

    if(list.length>0){
      return; // não envia; sumário aponta os erros
    }

    if(formInvalid){
      setError("Revise os campos destacados antes de continuar.");
      return;
    }

    setSaving(true);
    try{
      // 1) TITULAR -> /pessoas
      const e = titular.endereco || {};
      const bodyPessoa = {
        nome: (titular.nome || "").trim(),
        cpf: formatCPF(titular.cpf || ""),
        rg: (titular.rg || null),
        dataNascimento: titular.data_nascimento || null,
        sexo: mapSexoToApi(titular.sexo),
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

      const pessoaRes = await api.post("/api/v1/pessoas", bodyPessoa);
      const titularId = pessoaRes?.data?.id || pessoaRes?.data?.pessoaId || pessoaRes?.data?.uuid;
      if(!titularId) throw new Error("Não foi possível obter o ID do titular.");

      // 2) DEPENDENTES -> /dependentes
      const depsToCreate = deps
        .filter(d => (d.nome || "").trim().length >= 3)
        .map(d => ({
          cpf: d.cpf ? formatCPF(d.cpf) : null,
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
        await api.post("/api/v1/dependentes", payload);
      }

      // 3) CONTRATO -> /contratos
      const todayISO = new Date().toISOString().slice(0,10);
      const pickSafeDiaD = () => {
        const d = new Date().getDate();
        return Math.max(1, Math.min(28, d));
      };
      const contratoBody = {
        titularId: Number(titularId),
        planoId: Number(planoId),
        vendedorId: 717,
        dataContrato: todayISO,
        diaD: pickSafeDiaD(),
        cupom: cupom || null,
      };

      const contratoRes = await api.post("/api/v1/contratos", contratoBody);
      const contratoId = contratoRes?.data?.id || contratoRes?.data?.contratoId || contratoRes?.data?.uuid;

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
    L.push(`CPF: ${formatCPF(titular.cpf||"")}`);
    L.push(`Sexo: ${sexoLabelFromValue(titular.sexo)}`);
    L.push(`Celular: ${formatPhoneBR(titular.celular||"")}`);
    L.push(`E-mail: ${titular.email||"(não informado)"}`);
    L.push(`RG: ${titular.rg||""}`);
    L.push(`Estado civil: ${ESTADO_CIVIL_LABEL[titular.estado_civil]||titular.estado_civil||""}`);
    L.push(`Nascimento: ${titular.data_nascimento||""}`);
    const e=titular.endereco||{};
    L.push(`End.: ${e.logradouro||""}, ${e.numero||""} ${e.complemento||""} - ${e.bairro||""}`);
    L.push(`${e.cidade||""}/${e.uf||""} - CEP ${e.cep||""}`);
    L.push("\n*Dependentes*:");
    if(!deps.length) L.push("(Nenhum)");
    deps.forEach((d,i)=>L.push(`${i+1}. ${d.nome||"(sem nome)"} - ${labelParentesco(d.parentesco)} - ${sexoLabelFromValue(d.sexo)} - CPF: ${formatCPF(d.cpf||"") || "(não informado)"} - nasc.: ${d.data_nascimento||""}`));
    openWhatsApp(numero, L.join("\n"));
  }

  if(!payload || !planoId || !plano){
    return (
      <section className="section">
        <div className="container-max">
          <p className="mb-3 font-medium">Não encontramos os dados da simulação.</p>
          <CTAButton onClick={()=>navigate(-1)}>Voltar</CTAButton>
        </div>
      </section>
    );
  }

  const errorCount = errorList.length;

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

        {/* ALERTA GLOBAL DE ERRO API */}
        {error && (
          <div
            ref={alertRef}
            role="alert"
            tabIndex={-1}
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--text)',
            }}
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <h1 className="text-2xl font-extrabold tracking-tight">Cadastro</h1>
            <p className="mt-1 text-sm text-[var(--c-muted)]">
              Plano <b>{plano?.nome||""}</b> — Base mensal {money(baseMensal)}
            </p>

            {/* Titular */}
            <div className="mt-6">
              <h2 className="font-semibold text-lg">Titular</h2>

              <div className="mt-3 grid gap-3">
                <div>
                  <label className="label" htmlFor="titular-nome">
                    Nome completo <span aria-hidden="true" className="text-red-600">*</span>
                  </label>
                  <input
                    id="titular-nome"
                    ref={nomeRef}
                    className={`input h-11 w-full ${submitAttempted && !(titular.nome||"").trim() ? "ring-1 ring-red-500" : ""}`}
                    value={titular.nome}
                    onChange={e=>updTit({nome:e.target.value})}
                    placeholder="Como está no documento"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={submitAttempted && !(titular.nome||"").trim() ? "true" : "false"}
                  />
                  {submitAttempted && !(titular.nome||"").trim() && <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">Informe ao menos 3 caracteres.</p>}
                </div>

                {/* Linha 1 — CPF, RG, Estado Civil, Sexo */}
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <label className="label" htmlFor="titular-cpf">
                      CPF <span aria-hidden="true" className="text-red-600">*</span>
                    </label>
                    <input
                      id="titular-cpf"
                      ref={cpfRef}
                      className={`input h-11 w-full ${titular.cpf && !cpfIsValid(titular.cpf) ? "ring-1 ring-red-500" : ""}`}
                      inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
                      value={formatCPF(titular.cpf)} onChange={e=>updTit({cpf:maskCPF(e.target.value)})}
                      autoComplete="off"
                      aria-required="true"
                      aria-invalid={titular.cpf && !cpfIsValid(titular.cpf) ? "true" : "false"}
                    />
                    {titular.cpf && !cpfIsValid(titular.cpf) && <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">CPF inválido.</p>}
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
                    <label className="label" htmlFor="titular-sexo">
                      Sexo <span aria-hidden="true" className="text-red-600">*</span>
                    </label>
                    <select
                      id="titular-sexo"
                      ref={sexoRef}
                      className={`input h-11 w-full ${submitAttempted && !titular.sexo ? "ring-1 ring-red-500" : ""}`}
                      value={titular.sexo}
                      onChange={e=>updTit({sexo:e.target.value})}
                      aria-required="true"
                      aria-invalid={submitAttempted && !titular.sexo ? "true" : "false"}
                    >
                      <option value="">Selecione…</option>
                      {SEXO_OPTIONS.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
                    </select>
                    {submitAttempted && !titular.sexo && <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">Selecione o sexo.</p>}
                  </div>
                </div>

                {/* Linha 2 — Data de Nascimento, Celular e E-mail */}
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <label className="label">
                      Data de nascimento <span aria-hidden="true" className="text-red-600">*</span>
                    </label>
                    {/* foco no select de dia */}
                    <div ref={nascDiaRef}>
                      <DateSelectBR
                        className="w-full"
                        idPrefix="titular-nasc"
                        valueISO={titular.data_nascimento}
                        onChangeISO={(iso)=>updTit({data_nascimento:iso})}
                        invalid={Boolean(submitAttempted && (titularForaLimite || !titular.data_nascimento))}
                        minAge={titularMin}
                        maxAge={titularMax}
                      />
                    </div>
                    {submitAttempted && (!titular.data_nascimento || titularForaLimite) && (
                      <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        Precisa ter entre <b>{titularMin}</b> e <b>{titularMax}</b> anos.
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-4">
                    <label className="label" htmlFor="titular-cel">
                      Celular <span aria-hidden="true" className="text-red-600">*</span>
                    </label>
                    <input
                      id="titular-cel"
                      ref={celRef}
                      className={`input h-11 w-full ${submitAttempted && !phoneIsValid(titular.celular) ? "ring-1 ring-red-500" : ""}`}
                      inputMode="tel" placeholder="(11) 9XXXX-XXXX"
                      value={formatPhoneBR(titular.celular)} onChange={e=>updTit({celular:maskPhone(e.target.value)})}
                      autoComplete="tel-national"
                      aria-required="true"
                      aria-invalid={submitAttempted && !phoneIsValid(titular.celular) ? "true" : "false"}
                    />
                    {submitAttempted && !phoneIsValid(titular.celular) && <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">Informe um celular válido com DDD.</p>}
                  </div>

                  <div className="md:col-span-4">
                    <label className="label" htmlFor="titular-email">E-mail</label>
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
                <div className="grid gap-3 md:grid-cols-[210px,1fr,140px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label" htmlFor="end-cep">CEP</label>
                      <button
                        type="button"
                        className="text-xs underline text-[var(--c-muted)] hover:opacity-80 disabled:opacity-50"
                        onClick={()=>fetchCEP(titular.endereco.cep, titular)}
                        disabled={cepState.loading || onlyDigits(titular.endereco.cep).length!==8}
                        aria-label="Buscar endereço pelo CEP"
                      >
                        {cepState.loading ? "Buscando..." : "Buscar CEP"}
                      </button>
                    </div>
                    <input
                      id="end-cep"
                      ref={cepRef}
                      className={`input h-11 ${cepState.error ? "ring-1 ring-red-500" : ""}`}
                      inputMode="numeric" maxLength={9}
                      value={formatCEP(titular.endereco.cep)}
                      onChange={e=>{
                        const v=maskCEP(e.target.value);
                        setCepState(s=>({ ...s, error:"", found:false }));
                        updTitEndereco({cep:v});
                        debouncedBuscaCEP(v, titular);
                      }}
                      onBlur={(e)=>fetchCEP(e.target.value, titular)}
                      placeholder="00000-000"
                      autoComplete="postal-code"
                      aria-invalid={cepState.error ? "true":"false"}
                      aria-describedby={cepState.error ? "cep-error" : undefined}
                    />
                    {cepState.error && (
                      <p id="cep-error" className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
                        {cepState.error}
                      </p>
                    )}
                    {(!cepState.error && cepState.found) && (
                      <p className="text-xs text-green-700 mt-1" aria-live="polite">Endereço preenchido pelo CEP.</p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="end-log">Logradouro</label>
                    <input
                      id="end-log"
                      className="input h-11"
                      value={titular.endereco.logradouro}
                      onChange={e=>{ setAddrTouched({logradouro:true}); updTitEndereco({logradouro:e.target.value}); }}
                      autoComplete="address-line1"
                      disabled={cepState.loading}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="end-num">Número</label>
                    <input
                      id="end-num"
                      className="input h-11"
                      value={titular.endereco.numero}
                      onChange={e=>updTitEndereco({numero:e.target.value})}
                      autoComplete="address-line2"
                      disabled={cepState.loading}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,100px]">
                  <div>
                    <label className="label" htmlFor="end-comp">Complemento</label>
                    <input
                      id="end-comp"
                      className="input h-11"
                      value={titular.endereco.complemento}
                      onChange={e=>updTitEndereco({complemento:e.target.value})}
                      disabled={cepState.loading}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="end-bairro">Bairro</label>
                    <input
                      id="end-bairro"
                      className="input h-11"
                      value={titular.endereco.bairro}
                      onChange={e=>{ setAddrTouched({bairro:true}); updTitEndereco({bairro:e.target.value}); }}
                      disabled={cepState.loading}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="end-cidade">Cidade</label>
                    <input
                      id="end-cidade"
                      className="input h-11"
                      value={titular.endereco.cidade}
                      onChange={e=>{
                        setAddrTouched({cidade:true});
                        const cidade=e.target.value;
                        const uf=titular.endereco.uf || UF_PADRAO || "";
                        updTitEndereco({ cidade, uf });
                      }}
                      autoComplete="address-level2"
                      disabled={cepState.loading}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="end-uf">UF</label>
                    <input
                      id="end-uf"
                      className="input h-11"
                      value={titular.endereco.uf}
                      onChange={e=>{
                        setAddrTouched({uf:true});
                        const v=sanitizeUF(e.target.value);
                        updTitEndereco({ uf:v });
                      }}
                      maxLength={2}
                      autoComplete="address-level1"
                      disabled={cepState.loading}
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
                          <label className="label" htmlFor={`dep-${i}-nome`}>Nome completo</label>
                          <input id={`dep-${i}-nome`} className="input h-11 w-full" placeholder="Nome do dependente" value={d.nome} onChange={e=>updDep(i,{nome:e.target.value})}/>
                        </div>
                        <div className="md:col-span-3">
                          <label className="label" htmlFor={`dep-${i}-parentesco`}>Parentesco <span aria-hidden="true" className="text-red-600">*</span></label>
                          <select
                            id={`dep-${i}-parentesco`}
                            className={`input h-11 w-full ${showParentescoError?"ring-1 ring-red-500":""}`}
                            value={d.parentesco}
                            onChange={e=>updDep(i,{parentesco:e.target.value})}
                            aria-required="true"
                          >
                            <option value="">Selecione…</option>
                            {(plano?.parentescos?.length ? plano.parentescos : PARENTESCOS_FALLBACK.map(([v])=>v)).map((v)=>(
                              <option key={v} value={v}>{PARENTESCO_LABELS[v] || v}</option>
                            ))}
                          </select>
                          {showParentescoError && <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">Selecione o parentesco.</p>}
                        </div>
                        <div className="md:col-span-3">
                          <label className="label" htmlFor={`dep-${i}-sexo`}>Sexo</label>
                          <select
                            id={`dep-${i}-sexo`}
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
                          <label className="label" htmlFor={`dep-${i}-cpf`}>CPF</label>
                          <input
                            id={`dep-${i}-cpf`}
                            className={`input h-11 w-full ${(d.cpf && !cpfIsValid(d.cpf)) ? "ring-1 ring-red-500" : ""}`}
                            inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
                            value={formatCPF(d.cpf||"")} onChange={e=>updDep(i,{cpf:maskCPF(e.target.value)})}
                            aria-invalid={(d.cpf && !cpfIsValid(d.cpf)) ? "true" : "false"}
                          />
                          {(d.cpf && !cpfIsValid(d.cpf)) && <p className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">CPF inválido.</p>}
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
                <p className="mt-2 text-xs inline-flex items-center gap-1 text-red-600" role="alert" aria-live="polite">
                  <AlertTriangle size={14}/> {countDepsFora} dependente(s) fora do limite etário do plano.
                </p>
              )}
            </div>

            {/* ✅ Sumário de erros compacto — após tentativa de envio */}
            {submitAttempted && errorList.length > 0 && (
              <div
                className="rounded-lg px-4 py-3 text-sm mt-4"
                style={{
                  border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  color: 'var(--text)',
                }}
                role="alert"
                aria-live="assertive"
                ref={alertRef}
                tabIndex={-1}
              >
                <p className="font-medium mb-1">
                  Corrija os itens abaixo ({errorCount}):
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

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert" aria-live="assertive">{error}</div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* ✅ Botão sempre habilitado (exceto saving) + rótulo adaptativo */}
              <CTAButton
                type="button"
                onClick={handleSalvarEnviar}
                disabled={saving}
                className="h-12 w-full"
                aria-disabled={saving ? "true" : "false"}
                title={formInvalid ? "Clique para ver o que falta preencher" : "Enviar cadastro"}
              >
                {saving ? "Enviando…" : (formInvalid ? "Ver o que falta" : "Salvar e continuar")}
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
          {/* ✅ Botão sempre habilitado (exceto saving) + rótulo adaptativo */}
          <CTAButton
            className="min-w-[44%] h-12"
            type="button"
            onClick={handleSalvarEnviar}
            disabled={saving}
            aria-disabled={saving ? "true" : "false"}
            title={formInvalid ? "Clique para ver o que falta preencher" : "Enviar cadastro"}
          >
            {saving ? "Enviando…" : (formInvalid ? "Ver o que falta" : "Continuar")}
          </CTAButton>
        </div>
      </div>
      <div className="h-16 md:hidden" aria-hidden/>
    </section>
  );
}
