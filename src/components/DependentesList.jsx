// src/components/DependentesList.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { showToast } from '@/lib/toast'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { X, Printer } from 'lucide-react'

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
  const [Y, M, D] = (
    txt.includes('/') ? txt.split('/').reverse() : txt.split('T')[0].split('-')
  ).map(Number)
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
const parentescoLabel = (v) =>
  PAR[String(v || '').trim().toUpperCase()] || 'Dependente'

const initials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')

const onlyDigits = (v = '') => String(v).replace(/\D+/g, '')

const pick = (...vals) => vals.find((v) => v !== null && v !== undefined && String(v).trim() !== '')

/**
 * Normaliza o "contrato" para garantir que a CarteirinhaAssociado consiga preencher:
 * - nomePlano
 * - numeroContrato
 * - dataEfetivacao
 *
 * (em alguns pontos do app, o contrato vem com chaves diferentes)
 */
function normalizeContratoForCarteirinha(base = {}) {
  const planoNome = pick(
    base?.nomePlano,
    base?.planoNome,
    base?.nome_plano,
    base?.plano?.nome,
    base?.plano?.descricao,
    base?.pacote?.nome,
    base?.nomePacote
  )

  const numeroContrato = pick(
    base?.numeroContrato,
    base?.numero_contrato,
    base?.numero,
    base?.contratoNumero,
    base?.contrato_id,
    base?.contratoId,
    base?.id
  )

  const dataEfetivacao = pick(
    base?.dataEfetivacao,
    base?.data_efetivacao,
    base?.efetivacao,
    base?.dataContrato,
    base?.data_contrato,
    base?.criadoEm,
    base?.createdAt,
    base?.dataCadastro
  )

  // devolve o base + “aliases” para as chaves que a carteirinha já lê
  return {
    ...base,
    ...(planoNome ? { nomePlano: planoNome } : {}),
    ...(numeroContrato ? { numeroContrato } : {}),
    ...(dataEfetivacao ? { dataEfetivacao } : {}),
  }
}

/* ===================== componente ===================== */
export default function DependentesList({ dependentes = [], contrato }) {
  const warned = useRef(false)

  // modal state
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (warned.current) return
    if (!contrato && dependentes.length > 0) {
      showToast('Contrato não encontrado para exibir dependentes.')
      warned.current = true
      return
    }
    warned.current = true
  }, [contrato, dependentes.length])

  // ✅ contrato base normalizado (resolve plano/número/efetivação vazios na carteirinha do dependente)
  const contratoBase = useMemo(() => normalizeContratoForCarteirinha(contrato || {}), [contrato])

  const selectedUser = useMemo(() => {
    if (!selected) return null
    const nome = selected?.nome || 'Dependente'
    const cpfRaw =
      selected?.cpf ||
      selected?.documento ||
      selected?.cpfDependente ||
      selected?.cpf_dependente ||
      ''
    const cpfDigits = onlyDigits(cpfRaw)

    return {
      nome,
      cpf: cpfDigits,
      documento: cpfDigits,
      fotoUrl: selected?.fotoUrl || selected?.photoURL || '',
    }
  }, [selected])

  const contratoMerged = useMemo(() => {
    if (!selected || !selectedUser) return null

    const nomeTitular = pick(
      contratoBase?.nomeTitular,
      contratoBase?.titularNome,
      contratoBase?.nomePessoaTitular,
      contratoBase?.nome,
      ''
    )

    // 🔒 garante as 3 infos essenciais mesmo quando contratoBase vem “curto”
    const nomePlano = pick(contratoBase?.nomePlano, contratoBase?.plano?.nome, 'Plano')
    const numeroContrato = pick(contratoBase?.numeroContrato, contratoBase?.id, contratoBase?.contratoId, '—')
    const dataEfetivacao = pick(contratoBase?.dataEfetivacao, contratoBase?.dataContrato, contratoBase?.criadoEm, '')

    return {
      ...contratoBase,

      // garante preenchimento da carteirinha
      nomePlano,
      numeroContrato,
      dataEfetivacao,

      // dados do dependente
      nomeTitular: nomeTitular || '',
      nome: selectedUser.nome,
      cpfPessoa: selectedUser.cpf || selectedUser.documento || '',

      // sinalização interna (mesmo que você tenha removido o badge na UI)
      titular: false,
      isTitular: false,
    }
  }, [selected, selectedUser, contratoBase])

  function closeModal() {
    setOpen(false)
    setSelected(null)
  }

  function openCarteirinha(d) {
    // contratoBase é sempre objeto; valida se tem minimamente algum identificador
    const hasContrato = !!pick(contratoBase?.numeroContrato, contratoBase?.id, contratoBase?.contratoId)
    if (!hasContrato) {
      showToast('Contrato não encontrado para gerar carteirinha.')
      return
    }
    setSelected(d)
    setOpen(true)
  }

  function openPrint() {
    if (!selectedUser || !contratoMerged) return

    const w = window.open('/carteirinha/print?side=both', '_blank', 'noopener,noreferrer')
    if (!w) {
      showToast('Pop-up bloqueado. Permita pop-ups para imprimir.')
      return
    }

    const payload = {
      user: selectedUser,
      contrato: contratoMerged,
      side: 'both',
      pessoa: { titular: false },
    }

    try {
      sessionStorage.setItem('print_carteirinha_payload', JSON.stringify(payload))
    } catch {}

    try {
      w.location.href = '/carteirinha/print?side=both&from=session'
    } catch {}
  }

  const modal =
    open && selectedUser && contratoMerged
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Carteirinha do dependente"
            style={{
              background: 'rgba(0,0,0,0.62)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeModal()
            }}
            tabIndex={-1}
          >
            <div
              className="w-full max-w-3xl rounded-2xl border"
              style={{
                borderColor: 'rgba(255,255,255,0.10)',
                background: 'color-mix(in srgb, var(--surface) 92%, #000000)',
                boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
                overflow: 'hidden',
              }}
            >
              {/* top bar */}
              <div
                className="flex items-center justify-between gap-3 px-4 py-3 border-b"
                style={{
                  borderColor: 'color-mix(in srgb, var(--c-border) 70%, transparent)',
                }}
              >
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.12em] opacity-70">
                    Carteirinha
                  </div>
                  <div className="font-semibold truncate" title={selectedUser.nome}>
                    {selectedUser.nome}
                  </div>
                </div>

                <div className="flex items-center gap-2">


                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={closeModal}
                    aria-label="Fechar"
                    title="Fechar"
                    style={{ width: 40, height: 40, borderRadius: 999 }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* body */}
              <div className="p-4 sm:p-6 flex items-center justify-center">
                <CarteirinhaAssociado
                  user={selectedUser}
                  contrato={contratoMerged}
                  printable={false}
                  matchContratoHeight={false}
                  loadAvatar={false} // dependente: não puxar avatar do logado
                />
              </div>

              <div className="px-4 pb-4 text-xs opacity-70" style={{ color: 'var(--text)' }}>
                Dica: clique na carteirinha para virar (frente/verso) antes de imprimir.
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <section className="card rounded-2xl p-5 sm:p-6 border" style={{ borderColor: 'var(--c-border)' }}>
      {modal}

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
            borderColor: 'color-mix(in srgb, var(--primary) 25%, var(--c-border))',
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
                    <div
                      className="rounded-full grid place-items-center text-sm font-bold shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                        color: 'var(--primary)',
                        border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                      }}
                    >
                      {initials(nome)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate">{nome}</h4>

                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs opacity-90">
                            <span
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                                color: 'var(--primary)',
                                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
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

                        <div className="shrink-0">
                          <button
                            type="button"
                            className="btn-outline text-xs"
                            onClick={() => openCarteirinha(d)}
                            title="Gerar carteirinha do dependente"
                          >
                            Gerar carteirinha
                          </button>
                        </div>
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
