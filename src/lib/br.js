// src/lib/br.js
export const onlyDigits = (v="") => String(v).replace(/\D+/g,"");

export function cpfIsValid(cpf){
  cpf = onlyDigits(cpf);
  if(!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let s=0; for(let i=0;i<9;i++) s+=+cpf[i]*(10-i);
  let r=11-(s%11); if(r>=10) r=0; if(r!==+cpf[9]) return false;
  s=0; for(let i=0;i<10;i++) s+=+cpf[i]*(11-i);
  r=11-(s%11); if(r>=10) r=0; return r===+cpf[10];
}

export const formatCPF=(v="")=>v.replace(/\D/g,"").slice(0,11)
  .replace(/^(\d{3})(\d)/,"$1.$2")
  .replace(/^(\d{3})\.(\d{3})(\d)/,"$1.$2.$3")
  .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/,"$1.$2.$3-$4");
export const maskCPF = formatCPF;

export const formatCEP=(v="")=>v.replace(/\D/g,"").slice(0,8).replace(/^(\d{5})(\d)/,"$1-$2");
export const maskCEP=formatCEP;

export function formatPhoneBR(v=""){
  const d=onlyDigits(v).slice(0,11);
  if(d.length===0) return "";
  if(d.length<=2) return `(${d}`;
  if(d.length<=6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if(d.length===10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6,10)}`;
  if(d.length>=11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
  return d;
}
export const phoneIsValid = v => {
  const d=onlyDigits(v); return d.length===11 || d.length===10;
};

export const sanitizeUF = (v="") => v.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,2);

export const formatDateBR = (iso="")=>{
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if(!m) return iso||"";
  return `${m[3]}/${m[2]}/${m[1]}`;
};

export const normalizeISODate = (v="")=>{
  const s=String(v).trim();
  if(!s) return "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if(m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d=new Date(s);
  if(!isNaN(d)) return d.toISOString().slice(0,10);
  return s;
};
