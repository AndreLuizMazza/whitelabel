// src/pages/ServicosDigitais.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import { showToast } from '@/lib/toast'

const track = (..._args) => {}

/* ================== helpers ================== */

function extractPlanoLinks(plano) {
  if (!plano || !Array.isArray(plano.links)) return []
  return plano.links.filter((l) => l && l.link && l.visivel !== false)
}

function getHostFromLink(link) {
  if (!link) return ''
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/* ================== page ================== */

export default function ServicosDigitais() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}

  const planoIdFromState = state.planoId
  const numeroContrato = state.numeroContrato
  const nomePlano = state.nomePlano

  // fallback: /servicos-digitais?planoId=123
  let planoId = planoIdFromState
  try {
    const qs = new URLSearchParams(window.location.search)
    planoId = planoId || qs.get('planoId')
  } catch {
    // ignore
  }

  const [plano, setPlano] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  async function fetchPlano(planId) {
    if (!planId) {
      setErro('Plano não informado.')
      setLoading(false)
      return
    }
    setLoading(true)
    setErro('')
    try {
      const { data } = await api.get(`/api/v1/planos/${planId}`, {
        transformRequest: [(d, headers) => {
          try { delete headers.Authorization } catch {}
          return d
        }],
        __skipAuthRedirect: true,
      })
      setPlano(data)
    } catch (e1) {
      try {
        const { data } = await api.get(`/api/v1/planos/${planId}`, {
          headers: { Authorization: '' },
          __skipAuthRedirect: true,
        })
        setPlano(data)
      } catch (e2) {
        console.error('Erro ao carregar plano em Serviços Digitais', e2)
        setErro('Não foi possível carregar os serviços digitais deste plano.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!planoId) {
      setLoading(false)
      setErro('Nenhum plano foi informado para carregar os serviços digitais.')
      return
    }
    fetchPlano(planoId)
  }, [planoId])

  useEffect(() => {
    if (erro) showToast(erro)
  }, [erro])

  useEffect(() => {
    try { window.scrollTo(0, 0) } catch {}
  }, [])

  const links = useMemo(() => extractPlanoLinks(plano), [plano])
  const tituloPlano = plano?.nome || nomePlano || 'Plano'

  return (
    <section className="section">
      <div className="container-max">
        {/* topo: voltar + contexto */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)] focus:outline-none"
            style={{ borderColor: 'var(--c-border)' }}
            aria-label="Voltar"
          >
            ← Voltar
          </button>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Serviços digitais do seu plano
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text)' }}>
            Aqui você encontra os acessos online incluídos no seu plano. Utilize estes
            serviços para aproveitar ao máximo seus benefícios digitais.
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--text)' }}>
            Plano: <strong>{tituloPlano}</strong>
            {numeroContrato && <> • Contrato <strong>#{numeroContrato}</strong></>}
          </p>
        </header>

        {/* estados */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="card rounded-2xl p-3 md:p-4 animate-pulse"
                style={{ background: 'var(--surface)' }}
              >
                <div className="mb-3 h-24 md:h-28 rounded-xl" style={{ background: 'rgba(0,0,0,0.04)' }} />
                <div className="h-3 w-3/4 mb-2 rounded-full" style={{ background: 'rgba(0,0,0,0.05)' }} />
                <div className="h-3 w-5/6 mb-1 rounded-full" style={{ background: 'rgba(0,0,0,0.04)' }} />
                <div className="h-3 w-2/3 rounded-full" style={{ background: 'rgba(0,0,0,0.03)' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && erro && (
          <div
            className="card p-4 rounded-2xl"
            style={{
              border: '1px solid var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 9%, transparent)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--primary)' }}>
              {erro}
            </p>
          </div>
        )}

        {!loading && !erro && links.length === 0 && (
          <div className="card p-4 rounded-2xl">
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Este plano não possui serviços digitais cadastrados no momento.
            </p>
          </div>
        )}

        {!loading && !erro && links.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {links.map((item, idx) => {
              const logoUrl = item.logo || null
              const capaUrl = item.capa || null
              const observacoes = item.observacoes || ''
              const hasVisual = !!(logoUrl || capaUrl)
              const host = getHostFromLink(item.link)

              // título único (sem repetição)
              const tituloServico =
                item.descricao ||
                host ||
                'Serviço digital'

              return (
                <article
                  key={`${item.link}-${idx}`}
                  className="card flex flex-col rounded-2xl border overflow-hidden shadow-sm h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}
                >
                  {/* área visual (compacta) */}
                  {hasVisual && (
                    <div className="relative w-full overflow-hidden bg-[var(--c-soft)] max-h-[150px]">
                      {capaUrl && (
                        <div className="aspect-[16/7] w-full">
                          <img
                            src={capaUrl}
                            alt={tituloServico}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {!capaUrl && logoUrl && (
                        <div className="aspect-[16/7] w-full flex items-center justify-center">
                          <img
                            src={logoUrl}
                            alt={tituloServico}
                            className="max-h-16 max-w-[70%] object-contain"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {capaUrl && logoUrl && (
                        <div className="absolute left-2 bottom-2 rounded-lg bg-[color-mix(in_oklab,var(--c-surface) 82%,transparent)] px-2.5 py-1.5 shadow-sm">
                          <img
                            src={logoUrl}
                            alt={`${tituloServico} - logo`}
                            className="h-6 max-w-[90px] object-contain"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div
                        className="absolute right-2 top-2 rounded-full border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-wide"
                        style={{
                          borderColor: 'color-mix(in srgb, var(--primary) 45%, transparent)',
                          background: 'color-mix(in srgb, var(--primary) 10%, var(--c-surface))',
                          color: 'var(--primary)',
                        }}
                      >
                        Serviço digital
                      </div>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-3 md:p-4">
                    {/* título e descrições */}
                    <div className="mb-2">
                      <h2 className="text-[13px] font-semibold leading-snug">
                        {tituloServico}
                      </h2>

               
                      {observacoes && observacoes.trim().length > 0 && (
                        <div
                          className="mt-2 rounded-xl px-3 py-2 text-[11px] leading-snug max-h-24 overflow-y-auto"
                          style={{
                            background: 'color-mix(in srgb, var(--primary) 5%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
                            color: 'var(--text)',
                          }}
                        >
                          {observacoes}
                        </div>
                      )}

                      <p className="mt-2 text-[11px] break-all opacity-70">
                        {item.link}
                      </p>
                    </div>

                    {/* ações (compactas) */}
                    <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-[11px] flex-1 text-center justify-center py-2"
                        onClick={() =>
                          track('servicos_digitais_click', {
                            link: item.link,
                            descricao: item.descricao || null,
                            planoId,
                            numeroContrato,
                          })
                        }
                      >
                        Acessar serviço
                      </a>
                      <button
                        type="button"
                        className="btn-outline text-[11px] px-3 py-2 sm:w-auto"
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(item.link)
                            showToast('Link copiado para a área de transferência.')
                          } catch {
                            showToast('Não foi possível copiar o link.')
                          }
                        }}
                      >
                        Copiar link
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
