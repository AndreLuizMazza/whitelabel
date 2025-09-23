// src/pages/ClubeBeneficios.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api.js'
import { BadgePercent, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

import PlanosCompactCTA from '@/components/ctas/PlanosCompactCTA'
import MemorialCompactCTA from '@/components/ctas/MemorialCompactCTA'
import ParceirosCompactCTA from '@/components/ctas/ParceirosCompactCTA'

/* Placeholder suave para a faixa do card */
const CLUB_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgNDAwIDE2MCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmMWY1ZjkiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSI4MCIgcj0iNDYiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSIyMDAiIHk9Ijg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIsU2Vnb2UgVUksQXJpYWwsIHNhbnMtc2VyaWZiIiBmb250LXNpemU9IjI4IiBmaWxsPSIjNDc1NTY5Ij4lPC90ZXh0Pjwvc3ZnPg=='

/* --- Utils locais --- */
function ImgWithFallback({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}
function fmtBeneficio(b) {
  if (Number(b?.porcentagem)) return `${Number(b.porcentagem).toLocaleString('pt-BR')}%`
  const v = Number(b?.valor || 0)
  return v > 0 ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
}
function getEnderecoLinha(e = {}) {
  const partes = [
    e.logradouro, e.numero, e.bairro,
    e.cidade && e.uf ? `${e.cidade} - ${e.uf}` : e.cidade || e.uf,
    e.cep ? `CEP ${e.cep}` : '',
  ].filter(Boolean)
  return partes.join(', ')
}
function mapsLink(endereco = {}) {
  if (endereco.latitude && endereco.longitude) {
    return `https://www.google.com/maps?q=${endereco.latitude},${endereco.longitude}`
  }
  const q = encodeURIComponent(getEnderecoLinha(endereco))
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

/* --- UI: chip do benefício --- */
function BeneficioChip({ icon = <BadgePercent size={14} />, label, value, extraCount = 0 }) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
      style={{ border: '1px solid var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
    >
      <span className="shrink-0" style={{ color: 'var(--primary)' }}>{icon}</span>
      <span className="truncate">{label} • <b>{value}</b></span>
      {extraCount > 0 && (
        <span
          className="ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--primary-12)', color: 'var(--primary)' }}
        >
          +{extraCount}
        </span>
      )}
    </div>
  )
}

/* --- Card do parceiro --- */
function ParceiroCard({ p }) {
  const hasImg = p?.imagem && String(p.imagem).trim()
  const beneficios = Array.isArray(p?.beneficios) ? p.beneficios : []
  const principal = beneficios[0]
  const extraCount = Math.max(0, beneficios.length - 1)

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-md transition hover:-translate-y-[2px] hover:shadow-lg"
      style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
    >
      <div
        className="h-40 w-full flex items-center justify-center"
        style={{
          background: 'var(--surface)',
          backgroundImage: `url(${CLUB_PLACEHOLDER})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
        }}
      >
        {hasImg && (
          <ImgWithFallback
            src={p.imagem}
            alt={p?.nome || 'Parceiro'}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-base font-bold leading-tight line-clamp-2" style={{ color: 'var(--text)' }}>
          {p?.nome}
        </h3>

        {principal && (
          <BeneficioChip
            label={principal.descricao}
            value={fmtBeneficio(principal)}
            extraCount={extraCount}
          />
        )}

        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <Link to={`/beneficios/${p.id}`} className="btn-primary w-full justify-center">
            Ver detalhes
          </Link>
          <a
            href={mapsLink(p?.endereco)}
            target="_blank"
            rel="noreferrer"
            className="btn-outline w-full justify-center"
          >
            Como chegar
          </a>
        </div>
      </div>
    </article>
  )
}

/* --- Página: Clube de Benefícios --- */
export default function ClubeBeneficios() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(9)
  const [totalPages, setTotalPages] = useState(1)

  const [queryRaw, setQueryRaw] = useState('')
  const [cityRaw, setCityRaw] = useState('')
  const [query, setQuery] = useState('')
  const [cidade, setCidade] = useState('')

  const timers = useRef({})

  /* debounce busca por nome */
  useEffect(() => {
    clearTimeout(timers.current.query)
    timers.current.query = setTimeout(() => setQuery(queryRaw), 250)
    return () => clearTimeout(timers.current.query)
  }, [queryRaw])

  /* debounce filtro por cidade */
  useEffect(() => {
    clearTimeout(timers.current.city)
    timers.current.city = setTimeout(() => setCidade(cityRaw), 250)
    return () => clearTimeout(timers.current.city)
  }, [cityRaw])

  /* fetch paginado */
  async function fetchData({ resetPage = false } = {}) {
    try {
      setError('')
      setLoading(true)

      const params = new URLSearchParams()
      params.set('page', String(resetPage ? 0 : page))
      params.set('size', String(size))
      const qs = params.toString() ? `?${params.toString()}` : ''

      const { data } = await api.get(`/api/v1/locais/parceiros${qs}`)

      if (Array.isArray(data)) {
        setItems(data)
        setTotalPages(1)
        if (resetPage) setPage(0)
      } else {
        const list = Array.isArray(data.content) ? data.content : []
        setItems(list)
        const tp = Number(data.totalPages || 1)
        setTotalPages(tp > 0 ? tp : 1)
        if (resetPage) setPage(0)
      }
    } catch (e) {
      console.error(e)
      const msg =
        e?.response?.data?.error ||
        e?.response?.statusText ||
        e?.message ||
        'Erro desconhecido'
      setError('Não foi possível carregar os parceiros: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size])

  /* filtros client-side */
  const parceirosFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    const c = cidade.trim().toLowerCase()
    return items.filter((p) => {
      const nomeOK = !q || String(p?.nome || '').toLowerCase().includes(q)
      const cid = String(p?.endereco?.cidade || '').toLowerCase()
      const cidadeOK = !c || cid.includes(c)
      return nomeOK && cidadeOK
    })
  }, [items, query, cidade])

  function limparFiltros() {
    setQueryRaw(''); setCityRaw(''); setQuery(''); setCidade('')
    fetchData({ resetPage: true })
  }

  return (
    <section className="section">
      <div className="container-max">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight">Clube de Benefícios</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Parceiros com condições especiais para associados. Encontre descontos em saúde, exames, odontologia e mais.
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              className="input !pl-10"
              placeholder="Buscar por nome do parceiro"
              value={queryRaw}
              onChange={(e) => setQueryRaw(e.target.value)}
              aria-label="Buscar parceiro por nome"
            />
          </div>

          <input
            className="input md:max-w-xs"
            placeholder="Filtrar por cidade"
            value={cityRaw}
            onChange={(e) => setCityRaw(e.target.value)}
            aria-label="Filtrar por cidade"
          />

          <button
            onClick={limparFiltros}
            className="btn-outline text-sm"
            title="Limpar filtros"
          >
            <RotateCcw size={16} /> Limpar
          </button>

          <div className="grow" />
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {parceirosFiltrados.length} parceiro(s) nesta página
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--c-border)' }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: 'var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              color: 'var(--primary)',
            }}
          >
            {error}
            <div className="mt-3">
              <button onClick={() => fetchData()} className="btn-primary">Tentar de novo</button>
            </div>
          </div>
        )}

        {!loading && !error && parceirosFiltrados.length === 0 && (
          <div
            className="rounded-xl border p-6 text-center"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            Nenhum parceiro encontrado com os filtros atuais.
          </div>
        )}

        {/* Lista */}
        {!loading && !error && parceirosFiltrados.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {parceirosFiltrados.map((p) => (
                <ParceiroCard key={p.id} p={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Página <strong>{page + 1}</strong> de <strong>{totalPages}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((pp) => Math.max(0, pp - 1))}
                    disabled={page <= 0}
                    className="btn-outline text-sm disabled:opacity-50"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    onClick={() => setPage((pp) => Math.min(totalPages - 1, pp + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn-outline text-sm disabled:opacity-50"
                    aria-label="Próxima página"
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* CTAs finais */}
        <div className="mt-14 md:mt-16 border-t pt-8 md:pt-10" style={{ borderColor: 'var(--c-border)' }}>
          <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--text)' }}>
            Aproveite ainda mais os benefícios
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <PlanosCompactCTA
              onPrimary={() => navigate('/planos')}
              onSecondary={() => navigate('/planos?simular=1')}
            />
            <MemorialCompactCTA
              onPrimary={() => navigate('/memorial')}
              onSecondary={() => navigate('/memorial/sobre')}
            />
            <ParceirosCompactCTA
              onPrimary={() => navigate('/parceiros/inscrever')}
              onSecondary={() => window.open('https://wa.me/55SEUNUMERO?text=Quero%20ser%20parceiro', '_blank')}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
