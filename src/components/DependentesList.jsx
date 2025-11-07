// src/components/DependentesList.jsx

// Formata "YYYY-MM-DD" ou ISO -> "dd/MM/yyyy"
const fmtDataNasc = (s) => {
  if (!s) return '—'
  const txt = String(s)
  // já formatada
  if (txt.includes('/') && /^\d{2}\/\d{2}\/\d{4}$/.test(txt)) return txt
  // ISO ou YYYY-MM-DD
  const cleaned = txt.split('T')[0]
  const [Y, M, D] = cleaned.split('-')
  if (Y && M && D) return `${D}/${M}/${Y}`
  return txt
}

// Rótulos amigáveis
const PARENTESCO_LABELS = {
  TITULAR: 'Titular',
  CONJUGE: 'Cônjuge',
  FILHO: 'Filho(a)',
  FILHA: 'Filha',
  PAI: 'Pai',
  MAE: 'Mãe',
  SOGRO: 'Sogro',
  SOGRA: 'Sogra',
  ENTEADO: 'Enteado(a)',
  COMPANHEIRO: 'Companheiro(a)',
  OUTRO: 'Outro'
}
const labelParentesco = (v) => {
  if (!v) return 'Dependente'
  const key = String(v).trim().toUpperCase()
  return PARENTESCO_LABELS[key] || v
}

export default function DependentesList({ dependentes = [] }) {
  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold">Dependentes</h3>

      {dependentes.length === 0 ? (
        <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
          Nenhum dependente cadastrado.
        </p>
      ) : (
        <ul className="mt-3 divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {dependentes.map((d) => (
            <li key={d.id ?? d.dependenteId} className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{d.nome}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {labelParentesco(d.parentesco)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p style={{ color: 'var(--text)' }}>Nascimento</p>
                  <p className="font-medium">{fmtDataNasc(d.dataNascimento)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
