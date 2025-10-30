// src/lib/dates.js
export const toISODate = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10);

export function efetivacaoProxMesPorDiaD(diaD){
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = hoje.getMonth();
  const y2 = m === 11 ? y + 1 : y;
  const m2 = (m + 1) % 12;
  const maxDia = new Date(y2, m2 + 1, 0).getDate();
  const d = Math.min(diaD, maxDia);
  return toISODate(new Date(y2, m2, d));
}

export function ageFromDate(iso){
  if(!iso) return null;
  const d=new Date(iso); if(isNaN(d)) return null;
  const t=new Date(); let a=t.getFullYear()-d.getFullYear(); const m=t.getMonth()-d.getMonth();
  if(m<0 || (m===0 && t.getDate()<d.getDate())) a--;
  return a;
}
