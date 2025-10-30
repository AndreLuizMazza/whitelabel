DateSelectBR.jsximport { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

/** 
 * Select de data BR (dd/mm/aaaa) com controle por faixa etária.
 * Props:
 * - valueISO: string yyyy-mm-dd
 * - onChangeISO: (iso) => void
 * - invalid: boolean (pinta aviso)
 * - minAge, maxAge: number | undefined
 * - idPrefix: string (base pros ids)
 * - className: string
 */
export default function DateSelectBR({ valueISO, onChangeISO, invalid=false, className="", minAge, maxAge, idPrefix }) {
  const [dia,setDia]=useState(""); const [mes,setMes]=useState(""); const [ano,setAno]=useState("");
  const [softWarn,setSoftWarn]=useState("");
  const hydratedRef = useRef(false);

  useEffect(()=>{
    const m = typeof valueISO === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueISO||"");
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
  const daysInMonth=(y,m)=>new Date(y,m,0).getDate();

  function clampDayIfNeeded(y,m,d){
    if(!y||!m||!d) return d;
    const maxDMonth = daysInMonth(y,m);
    let minD=1, maxD=maxDMonth;
    if(y===minDate.getFullYear() && m===(minDate.getMonth()+1)) minD=minDate.getDate();
    if(y===maxDate.getFullYear() && m===(maxDate.getMonth()+1)) maxD=Math.min(maxDMonth,maxDate.getDate());
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
    const m = parseInt(mes,10)||0;
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
          {Array.from({length:31},(_,i)=>String(i+1).padStart(2,"0")).map(d=>(<option key={d} value={d}>{d}</option>))}
        </select>

        <label htmlFor={idMes} className="sr-only">Mês</label>
        <select id={idMes} className="input h-11" value={mes} onChange={e=>handleChangeMes(e.target.value)}>
          <option value="">Mês</option>
          {mesesAll.map(([v,l])=><option key={v} value={v}>{l}</option>)}
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
