// src/lib/cpf.js

/** Formata CPF -> 000.000.000-00 (sem proteger) */
export const formatCPF = (cpf = '') => {
  const d = String(cpf).replace(/\D+/g, '')
  return d.length === 11
    ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : cpf
}

/** ***.***.***-** (protege tudo) */
export const maskCPF_all = () => '***.***.***-**'

/** 000.***.***-** (mantém 3 primeiros) */
export const maskCPF_keepFirst3 = (cpf = '') => {
  const d = String(cpf).replace(/\D+/g, '')
  return d.length === 11 ? `${d.slice(0, 3)}.***.***-**` : maskCPF_all()
}

/** ***.***.***-00 (mantém 2 últimos – recomendado para UI) */
export const maskCPF_keepLast2 = (cpf = '') => {
  const d = String(cpf).replace(/\D+/g, '')
  return d.length === 11 ? `***.***.***-${d.slice(-2)}` : maskCPF_all()
}

/**
 * Exibição por contexto:
 * - 'none'   => completo (somente quando indispensável)
 * - 'first3' => 000.***.***-**
 * - 'last2'  => ***.***.***-00  (padrão)
 * - 'all'    => ***.***.***-**
 */
export function displayCPF(cpf, strategy = 'last2') {
  switch (strategy) {
    case 'none':   return formatCPF(cpf)
    case 'first3': return maskCPF_keepFirst3(cpf)
    case 'all':    return maskCPF_all()
    default:       return maskCPF_keepLast2(cpf)
  }
}
