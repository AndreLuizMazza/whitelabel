// src/components/DependentesList.jsx
import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics'
import { showToast } from '@/lib/toast'

const fmtDataNasc = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const [Y, M, D] = t.split('T')[0].split('-')
  return (Y && M && D) ? `${D}/${M}/${Y}` : t
}

const PARENTESCO_LABELS = {
  TITULAR: 'Titular', CONJUGE: 'Cônjuge', FILHO: 'Filho(a)', FILHA: 'Filha',
  PAI: 'Pai', MAE: 'Mãe', SOGRO: 'Sogro', SOGRA: 'Sogra', ENTEADO: 'Enteado(a)',
  COMPANHEIRO: 'Companheiro(a)', OUTRO: 'Outro'
}
const labelParentesco = (v) => {
  if (!v) return 'Dependente'
  const key = String(v).trim().toUpperCase()
  return PARENTESCO_LABELS[key] || v
}
const initials = (name = '') =>
  String(name).trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('')

function buildWhats(number, msg) {
  const digits = String(number || '').replace(/\D+/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null
}

export default function DependentesList({ dependentes = [], contrato }) {
  const warnedRef = useRef(false)

  useEffect(() => {
    if (warnedRef.current) return
    if (!contrato) {
      showToast('Contrato não encontrado para exibir dependentes.')
      warnedRef.current = true
      return
    }
    if (dependentes.length === 0) showToast('Nenhum dependente cadastrado ainda.')
    warnedRef.current = true
  }, [dependentes, contrato])

  const podeAdicionar = Number(contrato?.limiteDependentes || 0) === 0
    ? true
    : (dependentes?.length || 0) < Number(contrato?.limiteDependentes || 0)

  const waHref = buildWhats(
    contrato?.unidade?.whatsapp || contrato?.contatos?.celular,
    'Olá! Preciso de ajuda com meus dependentes.'
  )
  function avisar(motivo) {
    track('feature_unavailable', { motivo })
    showToast(`${motivo} — funcionalidade ainda não disponível.`,
      waHref ? () => window.open(waHref, '_blank', 'noopener,noreferrer') : null)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          Dependentes e Beneficiários {dependentes?.length ? `(${dependentes.length})` : ''}
        </h3>
        <div className="flex gap-2">
          {podeAdicionar && (
            <button className="btn-primary text-xs" onClick={() => avisar('Adicionar dependente')}>
              Adicionar dependente
            </button>
          )}
          <button className="btn-outline text-xs" onClick={() => avisar('Baixar carteirinhas')}>
            Baixar carteirinhas
          </button>
        </div>
      </div>

      {dependentes.length === 0 ? (
        <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>Nenhum dependente cadastrado.</p>
      ) : (
        <ul className="mt-3 divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {dependentes.map((d) => {
            const nome = d.nome || '—'
            return (
              <li key={d.id ?? d.dependenteId} className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    {/* avatar iniciais */}
                    <div
                      className="rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-[12px] font-semibold
                                 flex items-center justify-center shrink-0"
                      style={{
                        width: 34,
                        height: 34,
                        color: 'var(--primary)',
                        border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                      }}
                    >
                      {initials(nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{nome}</p>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>
                        {labelParentesco(d.parentesco)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <p style={{ color: 'var(--text)' }}>Nascimento</p>
                    <p className="font-medium">{fmtDataNasc(d.dataNascimento)}</p>

                    {/* Ações (ícone + rótulo curtos) */}
                    <div className="mt-2 flex justify-end gap-2 flex-wrap">
                      <button className="btn-outline text-xs" onClick={() => avisar('Editar dependente')} aria-label="Editar">
                        ✏️ Editar
                      </button>
                      <button className="btn-outline text-xs" onClick={() => avisar('Carteirinha do dependente')} aria-label="Carteirinha">
                        🎫 Carteirinha
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
