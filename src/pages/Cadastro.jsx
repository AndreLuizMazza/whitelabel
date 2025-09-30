// src/pages/Cadastro.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import { money, pick, getMensal } from "@/lib/planUtils.js";
import { CheckCircle2, ChevronLeft, AlertTriangle, MessageCircle, Plus, Trash2 } from "lucide-react";

/* =============== utils/minis =============== */
function useQuery(){ const {search}=useLocation(); return useMemo(()=>new URLSearchParams(search),[search]); }
function decodePayloadParam(p){ try{ return JSON.parse(decodeURIComponent(atob(p))); }catch{ try{ return JSON.parse(atob(p)); }catch{ try{ return JSON.parse(decodeURIComponent(p)); }catch{ return null; } } } }
const onlyDigits=(v="")=>String(v).replace(/\D+/g,"");
function cpfIsValid(cpf){ cpf=onlyDigits(cpf); if(!cpf||cpf.length!==11||/^(\d)\1{10}$/.test(cpf))return false; let s=0; for(let i=0;i<9;i++) s+=+cpf[i]*(10-i); let r=11-(s%11); if(r>=10)r=0; if(r!==+cpf[9])return false; s=0; for(let i=0;i<10;i++) s+=+cpf[i]*(11-i); r=11-(s%11); if(r>=10)r=0; return r===+cpf[10]; }
const formatCPF=(v="")=>v.replace(/\D/g,"").slice(0,11).replace(/^(\d{3})(\d)/,"$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/,"$1.$2.$3").replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/,"$1.$2.$3-$4");
const maskCPF=(v="")=>formatCPF(v);
const formatCEP=(v="")=>v.replace(/\D/g,"").slice(0,8).replace(/^(\d{5})(\d)/,"$1-$2");
const maskCEP=(v="")=>formatCEP(v);
function openWhatsApp(number,message){ const n=number?onlyDigits(number):""; const text=encodeURIComponent(message||""); const url=n?`https://wa.me/${n}?text=${text}`:`https://wa.me/?text=${text}`; window.open(url,"_blank","noopener"); }

/* ===== parentescos fallback (usado só se API vier vazia) ===== */
const PARENTESCOS_FALLBACK = [
  ["CONJUGE","Cônjuge"],["COMPANHEIRO","Companheiro(a)"],["FILHO","Filho(a)"],["PAI","Pai"],["MAE","Mãe"],["IRMAO","Irmã(o)"],["AVO","Avô(ó)"],["TITULAR","Titular"],
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

/* =============== DateSelectBR (limites reais + erro inline) =============== */
function DateSelectBR({ valueISO, onChangeISO, invalid=false, className="", minAge, maxAge }) {
  const [dia,setDia]=useState(""); const [mes,setMes]=useState(""); const [ano,setAno]=useState("");
  const [softWarn,setSoftWarn]=useState("");

  useEffect(()=>{ if(!valueISO){ setDia(""); setMes(""); setAno(""); return; }
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(valueISO);
    if(!m){ setDia(""); setMes(""); setAno(""); return; }
    setAno(m[1]); setMes(m[2]); setDia(m[3]);
  },[valueISO]);

  const today=new Date(); const thisYear=today.getFullYear();

  // Datas-limite inclusivas
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
  const daysInMonth=(y,m)=>new Date(y,m,0).getDate();

  const mesesFiltrados=useMemo(()=>{ if(!ano) return mesesAll;
    const y=parseInt(ano,10);
    const minM=(y===minY)?(minDate.getMonth()+1):1;
    const maxM=(y===maxY)?(maxDate.getMonth()+1):12;
    return mesesAll.filter(([v])=>{const m=parseInt(v,10); return m>=minM && m<=maxM;});
  },[ano,minY,maxY]);

  const diasFiltrados=useMemo(()=>{ if(!ano||!mes){ return Array.from({length:31},(_,i)=>String(i+1).padStart(2,"0")); }
    const y=parseInt(ano,10), m=parseInt(mes,10); const maxDMonth=daysInMonth(y,m);
    let minD=1, maxD=maxDMonth;
    if(y===minY && m===(minDate.getMonth()+1)) minD=minDate.getDate();
    if(y===maxY && m===(maxDate.getMonth()+1)) maxD=Math.min(maxDMonth,maxDate.getDate());
    const arr=[]; for(let d=minD; d<=maxD; d++) arr.push(String(d).padStart(2,"0"));
    return arr;
  },[ano,mes,minY,maxY]);

  function inRange(iso){
    const d=new Date(iso);
    const a=new Date(minDate.getFullYear(),minDate.getMonth(),minDate.getDate());
    const b=new Date(maxDate.getFullYear(),maxDate.getMonth(),maxDate.getDate());
    return !isNaN(d) && d>=a && d<=b;
  }

  // monta ISO sempre que possível
  useEffect(()=>{ setSoftWarn("");
    if(dia && mes && ano){
      const iso=`${ano}-${mes}-${dia}`;
      if(inRange(iso)){ onChangeISO?.(iso); return; }
      onChangeISO?.(""); setSoftWarn("Data fora do limite permitido para este plano.");
      return;
    }
    onChangeISO?.("");
  },[dia,mes,ano]);

  return (
    <div>
      <div className={`grid grid-cols-3 gap-2 ${invalid?"ring-1 ring-red-500 rounded-md p-1":""} ${className}`}>
        <select className="input h-11" value={dia} onChange={e=>setDia(e.target.value)}>
          <option value="">Dia</option>{diasFiltrados.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select className="input h-11" value={mes} onChange={e=>setMes(e.target.value)}>
          <option value="">Mês</option>{mesesFiltrados.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input h-11" value={ano} onChange={e=>{ setAno(e.target.value); setMes(""); setDia(""); }}>
          <option value="">Ano</option>{anos.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {(invalid || softWarn) && (
        <p className={`mt-1 text-xs inline-flex items-center gap-1 ${invalid ? "text-red-600" : "text-amber-600"}`}>
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

  const payload=useMemo(()=>decodePayloadParam(q.get("p")),[q]);
  const planoId=payload?.plano; const cupom=payload?.cupom||"";

  const UF_PADRAO=(import.meta?.env?.VITE_UF_PADRAO||window.__UF_PADRAO__||"").toString().toUpperCase().slice(0,2);

  const [titular,setTitular]=useState({
    nome:"", cpf:"", rg:"", estado_civil:"", data_nascimento:"",
    endereco:{cep:"",logradouro:"",numero:"",complemento:"",bairro:"",cidade:"",uf:""}
  });
  const [deps,setDeps]=useState([]);

  useEffect(()=>{ (async()=>{ try{ if(planoId){ const {data}=await api.get(`/api/v1/planos/${planoId}`); setPlano(data);} }catch(e){ console.error(e); setError("Falha ao carregar plano."); }finally{ setLoading(false);} })(); },[planoId]);

  useEffect(()=>{ if(!payload) return; const qtd=Number(payload.qtdDependentes||0);
    const arr=Array.from({length:qtd}).map(()=>({nome:"",parentesco:"",data_nascimento:""}));
    if(Array.isArray(payload.dependentes)){
      payload.dependentes.forEach((d,i)=>{ if(!arr[i]) arr[i]={nome:"",parentesco:"",data_nascimento:""};
        if(typeof d.parentesco==="string") arr[i].parentesco=d.parentesco||"";
        arr[i].__idade_hint=d.idade ?? undefined; arr[i].nome=d.nome || arr[i].nome;
      });
    }
    setDeps(arr);
  },[payload]);

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
    const parentescoVazio = !d.parentesco;
    return { fora, age, parentescoVazio };
  });
  const countDepsFora=depsIssues.filter(x=>x.fora).length;
  const anyParentescoMissing=depsIssues.some(x=>x.parentescoVazio);

  const updTit=(patch)=>setTitular(t=>({...t,...patch}));
  const updTitEndereco=(patch)=>setTitular(t=>({...t,endereco:{...t.endereco,...patch}}));
  const updDep=(i,patch)=>setDeps(prev=>prev.map((d,idx)=>idx===i?{...d,...patch}:d));
  const addDep=()=>setDeps(prev=>[...prev,{nome:"",parentesco:"",data_nascimento:""}]);
  const delDep=(i)=>setDeps(prev=>prev.filter((_,idx)=>idx!==i));

  async function handleBuscaCEP(){
    const d=onlyDigits(titular.endereco.cep); if(d.length!==8) return;
    try{
      const res=await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data=await res.json();
      if(!data.erro){
        updTitEndereco({
          logradouro: data.logradouro || titular.endereco.logradouro,
          bairro: data.bairro || titular.endereco.bairro,
          cidade: data.localidade || titular.endereco.cidade,
          uf: (data.uf || titular.endereco.uf || UF_PADRAO || "").toUpperCase().slice(0,2),
        });
      }
    }catch{}
  }

  async function handleSalvarEnviar(){
    setSubmitAttempted(true);
    if(titularForaLimite || anyParentescoMissing){
      setError("Revise os campos destacados antes de continuar.");
      return;
    }
    setSaving(true); setError("");
    try{
      const familiaBody={
        planoId, cupom,
        titular:{
          nome: titular.nome?.trim(),
          cpf: onlyDigits(titular.cpf),
          rg: titular.rg || null,
          estado_civil: titular.estado_civil || null,
          data_nascimento: titular.data_nascimento || null,
          endereco: titular.endereco
        },
        dependentes: deps.map(d=>({
          nome: d.nome?.trim() || null,
          parentesco: d.parentesco || null,
          data_nascimento: d.data_nascimento || null
        }))
      };
      const famRes=await api.post("/api/v1/familias", familiaBody);
      const familiaId=famRes?.data?.id||famRes?.data?.uuid||famRes?.data?.id_familia;

      const contratoBody={ planoId, familiaId, cupom: cupom || undefined, totalMensal, totalAnual: totalMensal*12, dependentesInformados: deps.length };
      const orcRes=await api.post("/api/v1/orcamentos/contrato-simplificado", contratoBody);

      navigate(`/confirmacao?familia=${familiaId}&orcamento=${orcRes?.data?.id||""}`);
    }catch(e){
      console.error(e);
      setError("Não foi possível concluir pelo site. Você pode enviar por WhatsApp.");
    }finally{ setSaving(false); }
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
    L.push(`RG: ${titular.rg||""}`);
    L.push(`Estado civil: ${ESTADO_CIVIL_LABEL[titular.estado_civil]||titular.estado_civil||""}`);
    L.push(`Nascimento: ${titular.data_nascimento||""}`);
    const e=titular.endereco||{};
    L.push(`End.: ${e.logradouro||""}, ${e.numero||""} ${e.complemento||""} - ${e.bairro||""}`);
    L.push(`${e.cidade||""}/${e.uf||""} - CEP ${e.cep||""}`);
    L.push("\n*Dependentes*:");
    if(!deps.length) L.push("(Nenhum)");
    deps.forEach((d,i)=>L.push(`${i+1}. ${d.nome||"(sem nome)"} - ${labelParentesco(d.parentesco)} - nasc.: ${d.data_nascimento||""}`));
    openWhatsApp(numero, L.join("\n"));
  }

  if(loading){
    return (
      <section className="section">
        <div className="container-max space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-[var(--c-surface)]"/>
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
          <button onClick={()=>navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)]">
            <ChevronLeft size={16}/> Voltar
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
                  <label className="label">Nome completo</label>
                  <input className="input h-11 w-full" value={titular.nome} onChange={e=>updTit({nome:e.target.value})}/>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <label className="label">CPF</label>
                    <input
                      className={`input h-11 w-full ${titular.cpf && !cpfIsValid(titular.cpf) ? "ring-1 ring-red-500" : ""}`}
                      inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
                      value={formatCPF(titular.cpf)} onChange={e=>updTit({cpf:maskCPF(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="label">RG</label>
                    <input className="input h-11 w-full" value={titular.rg} onChange={e=>updTit({rg:e.target.value})} placeholder="RG"/>
                  </div>
                  <div>
                    <label className="label">Estado civil</label>
                    <select className="input h-11 w-full" value={titular.estado_civil} onChange={e=>updTit({estado_civil:e.target.value})}>
                      <option value="">Selecione…</option>
                      {ESTADO_CIVIL_OPTIONS.map(([v,l])=>(<option key={v} value={v}>{l}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Data de nascimento</label>
                    <DateSelectBR
                      valueISO={titular.data_nascimento}
                      onChangeISO={(iso)=>updTit({data_nascimento:iso})}
                      invalid={Boolean(titularForaLimite)}
                      minAge={Number.isFinite(idadeMinTit)?Number(idadeMinTit):undefined}
                      maxAge={Number.isFinite(idadeMaxTit)?Number(idadeMaxTit):undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 md:grid-cols-[180px,1fr,140px]">
                  <div>
                    <label className="label">CEP</label>
                    <input
                      className="input h-11"
                      inputMode="numeric" maxLength={9}
                      value={formatCEP(titular.endereco.cep)}
                      onChange={e=>updTitEndereco({cep:maskCEP(e.target.value)})}
                      onBlur={handleBuscaCEP}
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <label className="label">Logradouro</label>
                    <input className="input h-11" value={titular.endereco.logradouro} onChange={e=>updTitEndereco({logradouro:e.target.value})}/>
                  </div>
                  <div>
                    <label className="label">Número</label>
                    <input className="input h-11" value={titular.endereco.numero} onChange={e=>updTitEndereco({numero:e.target.value})}/>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,100px]">
                  <div>
                    <label className="label">Complemento</label>
                    <input className="input h-11" value={titular.endereco.complemento} onChange={e=>updTitEndereco({complemento:e.target.value})}/>
                  </div>
                  <div>
                    <label className="label">Bairro</label>
                    <input className="input h-11" value={titular.endereco.bairro} onChange={e=>updTitEndereco({bairro:e.target.value})}/>
                  </div>
                  <div>
                    <label className="label">Cidade</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.cidade}
                      onChange={e=>{
                        const cidade=e.target.value;
                        const uf=titular.endereco.uf || UF_PADRAO || "";
                        updTitEndereco({ cidade, uf });
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">UF</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.uf}
                      onChange={e=>{
                        const v=e.target.value.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,2);
                        updTitEndereco({ uf:v });
                      }}
                      maxLength={2}
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
                        <CTAButton variant="ghost" onClick={()=>delDep(i)} className="h-9 px-3">
                          <Trash2 size={16} className="mr-2"/> Remover
                        </CTAButton>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[3fr,0.9fr,1.4fr]">
                        <div>
                          <label className="label">Nome completo</label>
                          <input className="input h-11 w-full" placeholder="Nome do dependente" value={d.nome} onChange={e=>updDep(i,{nome:e.target.value})}/>
                        </div>
                        <div>
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
                        <div>
                          <label className="label">Data de nascimento</label>
                          <DateSelectBR
                            valueISO={d.data_nascimento}
                            onChangeISO={(iso)=>updDep(i,{data_nascimento:iso})}
                            invalid={Boolean(issue?.fora)}
                            minAge={Number.isFinite(idadeMinDep)?Number(idadeMinDep):undefined}
                            maxAge={Number.isFinite(idadeMaxDep)?Number(idadeMaxDep):undefined}
                          />
                          {d.__idade_hint && !d.data_nascimento && (
                            <p className="text-xs text-[var(--c-muted)] mt-2">Dica de idade informada: {d.__idade_hint} anos.</p>
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
                <p className="mt-2 text-xs inline-flex items-center gap-1 text-red-600">
                  <AlertTriangle size={14}/> {countDepsFora} dependente(s) fora do limite etário do plano.
                </p>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <CTAButton onClick={handleSalvarEnviar} disabled={saving||!!titularForaLimite} className="h-12 w-full">
                {saving ? "Enviando…" : "Salvar e continuar"}
              </CTAButton>
              <CTAButton variant="outline" onClick={sendWhatsFallback} className="h-12 w-full" title="Enviar cadastro por WhatsApp">
                <MessageCircle size={16} className="mr-2"/> Enviar por WhatsApp
              </CTAButton>
            </div>

            <p className="mt-3 text-xs text-[var(--c-muted)] inline-flex items-center gap-1">
              <CheckCircle2 size={14}/> Seus dados estão protegidos e serão usados apenas para a contratação.
            </p>
          </div>

          {/* Resumo no final */}
          <div className="p-6 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Plano</span><span className="font-medium text-right">{plano?.nome}</span></div>
              <div className="flex justify-between"><span>Base mensal</span><span>{money(baseMensal)}</span></div>
              <div className="flex justify-between"><span>Incluídos no plano</span><span>{numDepsIncl}</span></div>
              <div className="flex justify-between"><span>Dependentes adicionais ({excedentes}) × {money(valorIncMensal)}</span><span>{money(excedentes*valorIncMensal)}</span></div>
              <hr className="my-2"/>
              <div className="flex justify-between font-semibold text-base">
                <span>Total mensal</span><span className="text-[color:var(--primary)] font-extrabold">{money(totalMensal)}</span>
              </div>
              {cupom ? (<div className="flex justify-between"><span>Cupom</span><span className="font-medium">{cupom}</span></div>) : null}
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
          <CTAButton className="min-w-[44%] h-12" onClick={handleSalvarEnviar} disabled={saving||!!titularForaLimite}>
            {saving ? "Enviando…" : "Continuar"}
          </CTAButton>
        </div>
      </div>
      <div className="h-16 md:hidden" aria-hidden/>
    </section>
  );
}
