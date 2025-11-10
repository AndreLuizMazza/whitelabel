// src/components/DependentesList.jsx
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
  TITULAR: 'Titular', CONJUGE: 'Cônjuge', FILHO: 'Filho(a)',
  FILHA: 'Filha', PAI: 'Pai', MAE: 'Mãe', SOGRO: 'Sogro',
  SOGRA: 'Sogra', ENTEADO: 'Enteado(a)', COMPANHEIRO: 'Companheiro(a)',
  OUTRO: 'Outro'
}
const labelParentesco = (v) => {
  if (!v) return 'Dependente'
  const key = String(v).trim().toUpperCase()
  return PARENTESCO_LABELS[key] || v
}

function buildWhats(number, msg) {
  const digits = String(number || '').replace(/\D+/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
}

export default function DependentesList({ dependentes = [], contrato }) {
  const podeAdicionar = Number(contrato?.limiteDependentes || 0) === 0
    ? true
    : (dependentes?.length || 0) < Number(contrato?.limiteDependentes || 0)

  const waHref = buildWhats(
    contrato?.unidade?.whatsapp || contrato?.contatos?.celular,
    'Olá! Preciso de ajuda com meus dependentes ou com a telemedicina.'
  )

  function avisar(motivo) {
    track('feature_unavailable', { motivo })
    showToast(
      `${motivo} — funcionalidade ainda não disponível.`,
      waHref ? () => window.open(waHref, '_blank', 'noopener,noreferrer') : null
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Dependentes</h3>
        <div className="flex gap-2">
          {podeAdicionar && (
            <button
              className="btn-primary text-xs"
              onClick={() => avisar('Adicionar dependente')}
            >
              Adicionar dependente
            </button>
          )}
          <button
            className="btn-outline text-xs"
            onClick={() => track('dependents_download_cards', { count: dependentes.length })}
          >
            Baixar carteirinhas
          </button>
        </div>
      </div>

      {dependentes.length === 0 ? (
        <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
          Nenhum dependente cadastrado.
        </p>
      ) : (
        <ul className="mt-3 divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {dependentes.map((d) => (
            <li key={d.id ?? d.dependenteId} className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{d.nome}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {labelParentesco(d.parentesco)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p style={{ color: 'var(--text)' }}>Nascimento</p>
                  <p className="font-medium">{fmtDataNasc(d.dataNascimento)}</p>
                  <div className="mt-2 flex justify-end gap-2 flex-wrap">
                    <button className="btn-outline text-xs" onClick={() => avisar('Editar dependente')}>
                      Editar
                    </button>
                    <button className="btn-outline text-xs" onClick={() => avisar('Visualizar carteirinha')}>
                      Carteirinha
                    </button>
                    <button className="btn-primary text-xs" onClick={() => avisar('Ativar Telemedicina')}>
                      Ativar Telemedicina
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
