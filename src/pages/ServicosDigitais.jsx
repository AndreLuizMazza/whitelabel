// src/pages/ServicosDigitais.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import { showToast } from '@/lib/toast'

const track = (..._args) => {}

function extractPlanoLinks(plano) {
  if (!plano || !Array.isArray(plano.links)) return []
  return plano.links.filter((l) => l && l.link && l.visivel !== false)
}

function resolvePlanoLinkLabel(item) {
  if (item?.descricao) return item.descricao
  if (!item?.link) return 'Acesso'
  try {
    const host = new URL(item.link).hostname.replace(/^www\./, '')
    return host || 'Acesso'
  } catch {
    return item.link
  }
}

export default function ServicosDigitais() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}

  const planoIdFromState = state.planoId
  const numeroContrato = state.numeroContrato
  const nomePlano = state.nomePlano

  // fallback se quiser suportar query string: /servicos-digitais?planoId=123
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
    setLoading(true); setErro('')
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

        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Serviços digitais do seu plano
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text)' }}>
            Aqui você encontra os acessos online incluídos no seu plano.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text)' }}>
            Plano: <strong>{tituloPlano}</strong>
            {numeroContrato && <> • Contrato <strong>#{numeroContrato}</strong></>}
          </p>
        </header>

        {/* estados */}
        {loading && (
          <div className="space-y-3">
            <div className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
            <div className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
          </div>
        )}

        {!loading && erro && (
          <div
            className="card p-4"
            style={{
              border: '1px solid var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--primary)' }}>
              {erro}
            </p>
          </div>
        )}

        {!loading && !erro && links.length === 0 && (
          <div className="card p-4">
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Este plano não possui serviços digitais cadastrados no momento.
            </p>
          </div>
        )}

        {!loading && !erro && links.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {links.map((item, idx) => (
              <article
                key={`${item.link}-${idx}`}
                className="card p-4 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-sm font-semibold mb-1">
                    {resolvePlanoLinkLabel(item)}
                  </h2>
                  {item.descricao && (
                    <p className="text-xs mb-2" style={{ color: 'var(--text)' }}>
                      {item.descricao}
                    </p>
                  )}
                  <p className="text-[11px] break-all opacity-70">
                    {item.link}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs flex-1 text-center"
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
                    className="btn-outline text-[11px] px-2 py-1"
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
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
