// src/components/DependentesList.jsx
import { useEffect, useMemo, useRef } from 'react'
import { track } from '@/lib/analytics'
import { showToast } from '@/lib/toast'
import { Pencil, IdCard } from 'lucide-react'

/* ===================== utils ===================== */
const fmtDataNasc = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const [Y, M, D] = t.split('T')[0].split('-')
  return (Y && M && D) ? `${D}/${M}/${Y}` : t
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

/* ===================== componente ===================== */
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

  const waHref = buildWhats(
    contrato?.unidade?.whatsapp || contrato?.contatos?.celular,
    'Olá! Preciso de ajuda com meus dependentes.'
  )
  function avisar(motivo) {
    track('feature_unavailable', { motivo })
    showToast(`${motivo} — funcionalidade ainda não disponível.`,
      waHref ? () => window.open(waHref, '_blank', 'noopener,noreferrer') : null)
  }

  const total = dependentes?.length || 0
  const limite = Number(contrato?.limiteDependentes || 0)
  const hintLimite = limite > 0 ? `${total}/${limite}` : `${total}`

  const Header = useMemo(() => (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderBottom: '1px solid var(--c-border)' }}
    >
      <div className="flex items-center justify-between sm:block">
        <h3 className="text-lg font-semibold">
          Dependentes e Beneficiários
          <span className="ml-2 text-sm font-normal opacity-70">({hintLimite})</span>
        </h3>
      </div>
    </div>
  ), [hintLimite])

  return (
    <section className="card p-5">
      {Header}

      {/* ===== Estado vazio ===== */}
      {dependentes.length === 0 && (
        <div className="mt-6 rounded-xl p-6 text-sm"
          style={{
            background: 'color-mix(in srgb, var(--primary) 7%, transparent)',
            border: '1px dashed color-mix(in srgb, var(--primary) 30%, transparent)',
            color: 'var(--text)'
          }}
        >
          <p className="text-base font-medium">Nenhum dependente cadastrado.</p>
          <p className="opacity-80 mt-1">
            Seus dependentes ainda não foram adicionados ao contrato. 
            Entre em contato com a administração para mais informações.
          </p>
        </div>
      )}

      {/* ===== Lista ===== */}
      {dependentes.length > 0 && (
        <ul
          className="mt-4 grid gap-3"
          role="list"
          aria-label="Lista de dependentes e beneficiários"
          style={{ gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }}
        >
          {dependentes.map((d) => {
            const id = d.id ?? d.dependenteId
            const nome = d.nome || '—'
            const nasc = fmtDataNasc(d.dataNascimento)
            const idade = calcIdade(d.dataNascimento)
            const parentesco = labelParentesco(d.parentesco)

            return (
              <li key={id} role="listitem">
                <article
                  className="rounded-2xl border p-4 sm:p-5 transition-shadow hover:shadow-md"
                  style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar com iniciais */}
                    <div
                      className="rounded-full grid place-items-center shrink-0"
                      style={{
                        width: 44, height: 44,
                        background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                        color: 'var(--primary)',
                        border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                        fontSize: 14, fontWeight: 700
                      }}
                      aria-hidden="true"
                    >
                      {initials(nome)}
                    </div>

                    {/* Conteúdo principal */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h4 className="font-semibold truncate" title={nome}>{nome}</h4>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[13px]">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5"
                              style={{
                                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                                color: 'var(--primary)',
                                border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)'
                              }}
                            >
                              {parentesco}
                            </span>
                            <span className="opacity-80">
                              Nascimento: <strong className="opacity-100">{nasc}</strong>
                              {typeof idade === 'number' && idade >= 0 && (
                                <span className="ml-2 opacity-80">({idade} anos)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Ações no topo em telas maiores */}
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          <button
                            className="btn-outline inline-flex items-center gap-1.5 text-xs"
                            onClick={() => avisar('Editar dependente')}
                            aria-label={`Editar ${nome}`}
                          >
                            <Pencil size={16} aria-hidden="true" /> Editar
                          </button>
                          <button
                            className="btn-outline inline-flex items-center gap-1.5 text-xs"
                            onClick={() => avisar('Carteirinha do dependente')}
                            aria-label={`Carteirinha de ${nome}`}
                          >
                            <IdCard size={16} aria-hidden="true" /> Carteirinha
                          </button>
                        </div>
                      </div>

                      {/* Ações abaixo no mobile */}
                      <div className="mt-3 flex sm:hidden gap-2">
                        <button
                          className="btn-outline inline-flex items-center gap-1.5 text-xs flex-1 justify-center"
                          onClick={() => avisar('Editar dependente')}
                          aria-label={`Editar ${nome}`}
                        >
                          <Pencil size={16} aria-hidden="true" /> Editar
                        </button>
                        <button
                          className="btn-outline inline-flex items-center gap-1.5 text-xs flex-1 justify-center"
                          onClick={() => avisar('Carteirinha do dependente')}
                          aria-label={`Carteirinha de ${nome}`}
                        >
                          <IdCard size={16} aria-hidden="true" /> Carteirinha
                        </button>
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
