// src/components/DependentesList.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { showToast } from '@/lib/toast'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { MemberGroupedList } from '@/components/member/MemberGroupedList'
import { ChevronRight, X, Printer } from 'lucide-react'

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

const pick = (...vals) =>
  vals.find((v) => v !== null && v !== undefined && String(v).trim() !== '')

function isTitularEntry(d) {
  const p = String(d?.parentesco || '').trim().toUpperCase()
  return p === 'TITULAR' || d?.titular === true || d?.isTitular === true
}

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

  return {
    ...base,
    ...(planoNome ? { nomePlano: planoNome } : {}),
    ...(numeroContrato ? { numeroContrato } : {}),
    ...(dataEfetivacao ? { dataEfetivacao } : {}),
  }
}

function ParentescoBadge({ label, titular = false }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none shrink-0"
      style={{
        background: titular
          ? 'color-mix(in srgb, var(--primary) 14%, var(--surface))'
          : 'color-mix(in srgb, var(--text) 7%, var(--surface))',
        color: titular ? 'var(--primary)' : 'var(--text-muted)',
        border: `0.5px solid ${
          titular
            ? 'color-mix(in srgb, var(--primary) 22%, transparent)'
            : 'color-mix(in srgb, var(--text) 10%, transparent)'
        }`,
      }}
    >
      {label}
    </span>
  )
}

function DependenteRow({ dependente, onOpen }) {
  const nome = dependente.nome || '—'
  const nasc = fmtDataNasc(dependente.dataNascimento)
  const idade = calcIdade(dependente.dataNascimento)
  const titular = isTitularEntry(dependente)
  const parentesco = parentescoLabel(dependente.parentesco)

  const detailParts = [`Nasc. ${nasc}`]
  if (idade != null) detailParts.push(`${idade} anos`)

  return (
    <button
      type="button"
      onClick={() => onOpen(dependente)}
      className="flex items-center gap-3 w-full min-h-[72px] px-4 py-3 text-left transition active:opacity-80"
      aria-label={`Ver carteirinha de ${nome}`}
    >
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
        style={{
          background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
          color: 'var(--primary)',
        }}
      >
        {initials(nome)}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-[17px] leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
          {nome}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <ParentescoBadge label={parentesco} titular={titular} />
          <span className="text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
            {detailParts.join(' · ')}
          </span>
        </span>
      </span>

      <span className="shrink-0 flex flex-col items-end gap-0.5 pl-1">
        <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: 'var(--primary)' }}>
          Carteirinha
        </span>
        <ChevronRight
          size={16}
          strokeWidth={2.5}
          className="opacity-35"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        />
      </span>
    </button>
  )
}

/* ===================== componente ===================== */
export default function DependentesList({ dependentes = [], contrato }) {
  const warned = useRef(false)
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

  const contratoBase = useMemo(
    () => normalizeContratoForCarteirinha(contrato || {}),
    [contrato]
  )

  const sortedDependentes = useMemo(() => {
    return [...dependentes].sort((a, b) => {
      const aTit = isTitularEntry(a)
      const bTit = isTitularEntry(b)
      if (aTit && !bTit) return -1
      if (!aTit && bTit) return 1
      return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR')
    })
  }, [dependentes])

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

    const nomePlano = pick(contratoBase?.nomePlano, contratoBase?.plano?.nome, 'Plano')
    const numeroContrato = pick(
      contratoBase?.numeroContrato,
      contratoBase?.id,
      contratoBase?.contratoId,
      '—'
    )
    const dataEfetivacao = pick(
      contratoBase?.dataEfetivacao,
      contratoBase?.dataContrato,
      contratoBase?.criadoEm,
      ''
    )

    return {
      ...contratoBase,
      nomePlano,
      numeroContrato,
      dataEfetivacao,
      nomeTitular: nomeTitular || '',
      nome: selectedUser.nome,
      cpfPessoa: selectedUser.cpf || selectedUser.documento || '',
      titular: false,
      isTitular: false,
    }
  }, [selected, selectedUser, contratoBase])

  function closeModal() {
    setOpen(false)
    setSelected(null)
  }

  function openCarteirinha(d) {
    const hasContrato = !!pick(
      contratoBase?.numeroContrato,
      contratoBase?.id,
      contratoBase?.contratoId
    )
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
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Carteirinha de ${selectedUser.nome}`}
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
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
              className="w-full sm:max-w-3xl rounded-t-[20px] sm:rounded-[20px] overflow-hidden"
              style={{
                background: 'var(--surface)',
                boxShadow:
                  '0 -8px 40px color-mix(in srgb, var(--text) 18%, transparent), 0 0 0 0.5px color-mix(in srgb, var(--text) 8%, transparent)',
                maxHeight: 'min(92vh, 900px)',
              }}
            >
              <div
                className="sm:hidden flex justify-center pt-2 pb-1"
                aria-hidden="true"
              >
                <span
                  className="h-1 w-9 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--text) 18%, transparent)' }}
                />
              </div>

              <div
                className="flex items-center justify-between gap-3 px-4 py-3 border-b"
                style={{ borderColor: 'var(--separator, var(--c-border))' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    Carteirinha digital
                  </p>
                  <p className="text-[17px] font-semibold leading-snug line-clamp-2 mt-0.5">
                    {selectedUser.nome}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={openPrint}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full transition active:opacity-60"
                    aria-label="Imprimir carteirinha"
                    title="Imprimir"
                    style={{ color: 'var(--primary)' }}
                  >
                    <Printer size={20} strokeWidth={1.85} />
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full transition active:opacity-60"
                    aria-label="Fechar"
                    style={{
                      background: 'color-mix(in srgb, var(--text) 6%, var(--surface))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <X size={20} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div
                className="p-4 sm:p-6 flex items-center justify-center overflow-y-auto"
                style={{
                  paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                }}
              >
                <CarteirinhaAssociado
                  user={selectedUser}
                  contrato={contratoMerged}
                  printable={false}
                  matchContratoHeight={false}
                  loadAvatar={false}
                />
              </div>

              <p
                className="px-4 pb-4 text-[13px] text-center leading-snug"
                style={{
                  color: 'var(--text-muted)',
                  paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                }}
              >
                Toque na carteirinha para ver o verso.
              </p>
            </div>
          </div>,
          document.body
        )
      : null

  if (!dependentes.length) return null

  return (
    <section aria-label="Beneficiários do plano">
      {modal}

      <p
        className="px-1 mb-2 text-[13px] font-normal uppercase tracking-[0.02em]"
        style={{ color: 'var(--text-muted)' }}
      >
        Beneficiários do plano
      </p>

      <MemberGroupedList>
        {sortedDependentes.map((d) => (
          <DependenteRow
            key={d.id || d.dependenteId || d.cpf || d.nome}
            dependente={d}
            onOpen={openCarteirinha}
          />
        ))}
      </MemberGroupedList>

      <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Toque em um beneficiário para abrir a carteirinha digital.
      </p>
    </section>
  )
}
