import { useState } from 'react'
import api from '@/lib/api.js'
import { Link } from 'react-router-dom'
import { User, Lock } from 'lucide-react'

function somenteNumeros(v = '') {
  return String(v).replace(/\D/g, '')
}
function boolPt(v) {
  const b = typeof v === 'string' ? v.toLowerCase() === 'true' : Boolean(v)
  return b ? 'Sim' : 'Não'
}

// Skeleton simples para o estado "loading"
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

export default function ContratoPage() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [dados, setDados] = useState(null)

  async function buscar(e) {
    e.preventDefault()
    setErro('')
    setDados(null)

    const clean = somenteNumeros(cpf)
    if (!clean || clean.length !== 11) {
      setErro('Informe um CPF válido (11 dígitos).')
      return
    }

    setLoading(true)
    try {
      // BFF já faz fallback de token de cliente
      const { data } = await api.get(`/api/v1/contratos/cpf/${encodeURIComponent(clean)}`)
      setDados(data)
    } catch (e) {
      console.error(e)
      const msg =
        e?.response?.data?.error ||
        e?.response?.statusText ||
        e?.message ||
        'Erro desconhecido'
      setErro('Falha ao buscar contrato: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  // normaliza retorno (array direto, page.content, {contratos: [...]}, objeto único)
  const contratos = Array.isArray(dados)
    ? dados
    : Array.isArray(dados?.contratos)
      ? dados.contratos
      : Array.isArray(dados?.content)
        ? dados.content
        : (dados ? [dados] : [])

  return (
    <section className="section">
      <div className="container-max max-w-xl">
                <h2 className="text-2xl font-bold mb-1">2ª via de Boleto</h2>
        <p
          className="mb-4 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Consulte rapidamente segundas vias de boletos informando apenas o CPF do titular.
        </p>

        <form
          onSubmit={buscar}
          className="card p-5 flex flex-col gap-3"
          role="search"
          aria-label="Buscar contratos por CPF"
        >
          <label htmlFor="cpf" className="sr-only">
            CPF
          </label>
          <input
            id="cpf"
            className="input"
            placeholder="CPF (apenas números)"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(somenteNumeros(e.target.value))}
            maxLength={11}
            aria-invalid={Boolean(erro)}
          />

          <button className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? 'Buscando…' : 'Pesquisar'}
          </button>

          {erro && (
            <div
              className="rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
                background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                color: 'var(--primary)'
              }}
              role="alert"
            >
              {erro}
            </div>
          )}
        </form>

        {/* Estados */}
        {loading && (
          <div className="mt-6 grid gap-4">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !erro && dados && contratos.length === 0 && (
          <div
            className="mt-6 rounded-xl border p-4"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            Nenhum contrato encontrado para este CPF.
          </div>
        )}

        {!loading && contratos?.length > 0 && (
          <div className="grid gap-4 mt-6" aria-live="polite">
            {contratos.map((c, i) => {
              const id = c.id || c.numeroContrato || i
              const numero = c.numeroContrato ?? c.id ?? '—'
              const titular = c.nome ?? c.titularNome ?? '—'
              const plano = c.planoNome ?? c.plano?.nome ?? '—'
              const ativo = c.contratoAtivo ?? c.ativo ?? c.status === 'ATIVO'
              const emAtraso =
                c.atrasado ||
                c.emAtraso ||
                (Number(c.parcelasEmAtraso || c.qtdParcelasAtraso || 0) > 0)

              return (
                <div key={id} className="card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Contrato {numero}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Titular: {titular}
                      </div>
                    </div>

                    {emAtraso && (
                      <span
                        className="px-3 py-1 text-xs rounded-full"
                        style={{
                          background: 'var(--primary)',
                          color: 'var(--on-primary)'
                        }}
                      >
                        Em atraso
                      </span>
                    )}
                  </div>

                  <div
                    className="grid md:grid-cols-3 gap-4 mt-3 text-sm"
                    style={{ color: 'var(--text)' }}
                  >
                    <div>
                      Ativo: <strong>{boolPt(ativo)}</strong>
                    </div>
                    <div>
                      Parcelas em atraso:{' '}
                      <strong>{c.parcelasEmAtraso ?? c.qtdParcelasAtraso ?? 0}</strong>
                    </div>
                    <div>
                      Plano: <strong>{plano}</strong>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      className="btn-primary"
                      to={`/contratos/${c.id || c.numeroContrato || ''}/pagamentos`}
                      aria-label={`Ver parcelas do contrato ${numero}`}
                    >
                      Ver parcelas
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Separador + Área do Associado */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="flex-1 h-px"
              style={{ background: 'var(--c-border)' }}
            />
            <span
              className="text-xs font-medium tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              ou acesse com login
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: 'var(--c-border)' }}
            />
          </div>

          <div
            className="card p-5 flex flex-col gap-3"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  color: 'var(--primary)'
                }}
              >
                <User size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Área do associado</h3>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Acesse seus contratos, dependentes, boletos, histórico e carteirinha digital com login e senha.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <Link
                to="/area"
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                Entrar na área do associado
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
