// src/components/DependentesList.jsx
import { useEffect, useRef } from 'react'
import { showToast } from '@/lib/toast'

/* ===================== utils ===================== */
const fmtDataNasc = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const [Y, M, D] = t.split('T')[0].split('-')
  return Y && M && D ? `${D}/${M}/${Y}` : t
}

const calcIdade = (s) => {
  if (!s) return null
  const txt = String(s)
  const [Y, M, D] = (txt.includes('/') ? txt.split('/').reverse() : txt.split('T')[0].split('-')).map(Number)
  if (!Y || !M || !D) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - Y
  const m = hoje.getMonth() + 1 - M
  if (m < 0 || (m === 0 && hoje.getDate() < D)) idade--
  return idade >= 0 ? idade : null
}

const PAR = {
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
  OUTRO: 'Outro',
}
const parentescoLabel = (v) => PAR[String(v || '').trim().toUpperCase()] || 'Dependente'

const initials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')

/* ===================== componente ===================== */
export default function DependentesList({ dependentes = [], contrato }) {
  const warned = useRef(false)

  useEffect(() => {
    if (warned.current) return
    if (!contrato && dependentes.length > 0) {
      showToast('Contrato não encontrado para exibir dependentes.')
      warned.current = true
      return
    }
    warned.current = true
  }, [contrato, dependentes.length])

  return (
    <section
      className="card rounded-2xl p-5 sm:p-6 border"
      style={{ borderColor: 'var(--c-border)' }}
    >
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.12em] opacity-70">
          Beneficiários do plano
        </p>
        <h2 className="text-lg font-semibold mt-1">Dependentes</h2>
      </header>

      {dependentes.length === 0 && (
        <div
          className="rounded-xl border p-5 text-sm"
          style={{
            borderColor:
              'color-mix(in srgb, var(--primary) 25%, var(--c-border))',
            background: 'color-mix(in srgb, var(--primary) 6%, transparent)',
          }}
        >
          Nenhum dependente cadastrado para este contrato.
        </div>
      )}

      {dependentes.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {dependentes.map((d) => {
            const nome = d.nome || '—'
            const nasc = fmtDataNasc(d.dataNascimento)
            const idade = calcIdade(d.dataNascimento)

            return (
              <li key={d.id || d.dependenteId}>
                <article
                  className="rounded-2xl border p-4 sm:p-5"
                  style={{
                    borderColor: 'var(--c-border)',
                    background: 'var(--surface)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="rounded-full grid place-items-center text-sm font-bold shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        background:
                          'color-mix(in srgb, var(--primary) 14%, transparent)',
                        color: 'var(--primary)',
                        border:
                          '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                      }}
                    >
                      {initials(nome)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm truncate">
                        {nome}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs opacity-90">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              'color-mix(in srgb, var(--primary) 10%, transparent)',
                            color: 'var(--primary)',
                            border:
                              '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                          }}
                        >
                          {parentescoLabel(d.parentesco)}
                        </span>

                        <span>
                          Nasc.: <strong>{nasc}</strong>
                          {idade != null && ` (${idade} anos)`}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
