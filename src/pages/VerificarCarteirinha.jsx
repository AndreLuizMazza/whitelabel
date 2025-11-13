// src/pages/VerificarCarteirinha.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/lib/api'
import { displayCPF } from '@/lib/cpf'
import { showToast } from '@/lib/toast'
import useTenant from '@/store/tenant'

const onlyDigits = (v = '') => String(v).replace(/\D+/g, '')
const fmtDateBR = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const d = t.split('T')[0]
  const [Y, M, D] = d.split('-')
  return (Y && M && D) ? `${D}/${M}/${Y}` : t
}

// Skeleton
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border p-5 animate-pulse"
      style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
    >
      <div className="h-5 w-1/3 rounded bg-[color:color-mix(in_srgb,var(--primary)_10%,transparent)]" />
      <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
        <div className="h-4 w-3/4 rounded bg-[color:color-mix(in_srgb,var(--primary)_8%,transparent)]" />
        <div className="h-4 w-2/3 rounded bg-[color:color-mix(in_srgb,var(--primary)_8%,transparent)]" />
        <div className="h-4 w-1/2 rounded bg-[color:color-mix(in_srgb,var(--primary)_8%,transparent)]" />
      </div>
      <div className="mt-4 h-9 w-32 rounded-full bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)]" />
    </div>
  )
}

export default function VerificarCarteirinha() {
  const { cpf } = useParams()
  const cpfDigits = onlyDigits(cpf)
  const cpfMasked = useMemo(() => displayCPF(cpfDigits, 'last2'), [cpfDigits])

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [dados, setDados] = useState(null)

  const empresa = useTenant(s => s.empresa)
  const tenantName = empresa?.nomeFantasia || empresa?.razaoSocial || 'Unidade'

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (!cpfDigits || cpfDigits.length !== 11) {
          throw new Error('CPF inválido para verificação.')
        }
        setLoading(true)
        setErro('')
        setDados(null)

        // Usa o mesmo endpoint/forma do exemplo (CPF somente números)
        const { data } = await api.get(`/api/v1/contratos/cpf/${encodeURIComponent(cpfDigits)}`)
        if (!alive) return
        setDados(data)
      } catch (e) {
        if (!alive) return
        const msg =
          e?.response?.data?.error ||
          e?.response?.statusText ||
          e?.message ||
          'Erro desconhecido'
        setErro('Falha ao verificar: ' + msg)
        showToast('Não foi possível validar a carteirinha.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [cpfDigits])

  // Normalização (igual ao seu padrão)
  const contratos = Array.isArray(dados)
    ? dados
    : Array.isArray(dados?.contratos)
      ? dados.contratos
      : Array.isArray(dados?.content)
        ? dados.content
        : (dados ? [dados] : [])

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Validação de Carteirinha</h1>
        <p className="text-sm text-gray-500">
          CPF consultado: <strong>{cpfMasked || '—'}</strong>
        </p>
      </header>

      {loading && (
        <section className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
        </section>
      )}

      {!loading && erro && (
        <section>
          <h2 className="sr-only">Erro</h2>
          <div className="rounded-xl border p-6"
               style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {erro}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Verifique o CPF informado e tente novamente. Se o problema persistir, contate a {tenantName}.
            </p>
          </div>
        </section>
      )}

      {!loading && !erro && contratos.length === 0 && (
        <section className="rounded-xl border p-6"
                 style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}>
          Nenhum contrato encontrado para este CPF.
        </section>
      )}

      {!loading && !erro && contratos.length > 0 && (
        <section className="space-y-4" aria-live="polite">
          {contratos.map((c, i) => {
            const id = c.id || c.numeroContrato || i
            const numero = c.numeroContrato ?? c.id ?? '—'
            const titular = c.nomeTitular || c.nome || '—'
            const plano = c.nomePlano || c.plano?.nome || '—'
            const ativo = c.contratoAtivo ?? c.ativo ?? c.status === 'ATIVO'
            const emAtraso = c.atrasado || (Number(c.parcelasEmAtraso || 0) > 0)

            return (
              <article key={id} className="rounded-xl border p-5"
                       style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      {ativo ? 'Contrato Ativo' : 'Contrato Inativo'}
                    </div>
                    <h2 className="text-lg font-semibold truncate">
                      {titular} — Plano {plano}
                    </h2>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Nº do contrato: <strong>{numero}</strong>
                      {' · Efetivação: '}<strong>{fmtDateBR(c.dataEfetivacao || c.dataContrato)}</strong>
                    </div>
                  </div>

                  <span
                    className="text-xs px-2 py-1 rounded-full border"
                    style={{
                      color: ativo ? 'var(--primary)' : 'var(--text-muted)',
                      borderColor: 'var(--c-border)',
                      background: 'var(--primary-08)'
                    }}
                  >
                    {ativo ? 'Válido' : 'Não válido'}
                  </span>
                </div>

                {emAtraso && (
                  <div className="mt-3 text-sm text-amber-600">
                    Há parcelas em atraso ({c.parcelasEmAtraso ?? 0}). A validade pode estar condicionada.
                  </div>
                )}

                {c.endereco && (
                  <div className="mt-3 text-sm" style={{ color: 'var(--text)' }}>
                    {[
                      c.endereco?.logradouro, c.endereco?.numero, c.endereco?.bairro,
                      c.endereco?.cidade, c.endereco?.uf
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
