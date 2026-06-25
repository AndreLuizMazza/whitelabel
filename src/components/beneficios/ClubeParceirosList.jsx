import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react'
import api from '@/lib/api.js'
import { mergeMemberOffersFromParceiros, orderByRankKeys, shuffleArray } from '@/components/beneficios/beneficiosUtils'
import MemberParceirosStoryStrip from '@/components/beneficios/member/MemberParceirosStoryStrip'
import MemberParceiroOffersFeed from '@/components/beneficios/member/MemberParceiroOffersFeed'
import ParceiroMemberFeedCard from '@/components/beneficios/member/ParceiroMemberFeedCard'
import ParceiroCard from './ParceiroCard'

function MemberSearchBar({ queryRaw, cityRaw, onQueryChange, onCityChange, onClear, count }) {
  return (
    <div className="space-y-3 mb-3">
      <div
        className="rounded-[10px] overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--separator, var(--c-border))',
        }}
      >
        <label className="flex items-center gap-2 px-4 min-h-[44px] border-b" style={{ borderColor: 'var(--separator, var(--c-border))' }}>
          <Search size={17} className="shrink-0 opacity-45" style={{ color: 'var(--text-muted)' }} />
          <input
            className="flex-1 min-w-0 bg-transparent text-[17px] outline-none placeholder:opacity-50"
            placeholder="Buscar parceiro"
            value={queryRaw}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Buscar parceiro por nome"
          />
        </label>
        <label className="flex items-center gap-2 px-4 min-h-[44px]">
          <span className="text-[13px] shrink-0 w-[52px]" style={{ color: 'var(--text-muted)' }}>
            Cidade
          </span>
          <input
            className="flex-1 min-w-0 bg-transparent text-[17px] outline-none placeholder:opacity-50"
            placeholder="Filtrar"
            value={cityRaw}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label="Filtrar por cidade"
          />
          {(queryRaw || cityRaw) ? (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 text-[15px] font-medium px-1 min-h-[44px] active:opacity-60"
              style={{ color: 'var(--primary)' }}
            >
              Limpar
            </button>
          ) : null}
        </label>
      </div>
      {count != null ? (
        <p className="px-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {count} parceiro{count === 1 ? '' : 's'} nesta página
        </p>
      ) : null}
    </div>
  )
}

export default function ClubeParceirosList({
  detailBase = '/area/beneficios',
  showIntro = true,
  className = '',
  variant = 'card',
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const [page, setPage] = useState(0)
  const [size] = useState(variant === 'member' ? 24 : 9)
  const [totalPages, setTotalPages] = useState(1)

  const [queryRaw, setQueryRaw] = useState('')
  const [cityRaw, setCityRaw] = useState('')
  const [query, setQuery] = useState('')
  const [cidade, setCidade] = useState('')

  const timers = useRef({})
  const isMember = variant === 'member'

  useEffect(() => {
    clearTimeout(timers.current.query)
    timers.current.query = setTimeout(() => setQuery(queryRaw), 250)
    return () => clearTimeout(timers.current.query)
  }, [queryRaw])

  useEffect(() => {
    clearTimeout(timers.current.city)
    timers.current.city = setTimeout(() => setCidade(cityRaw), 250)
    return () => clearTimeout(timers.current.city)
  }, [cityRaw])

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

  const shuffleRanks = useMemo(
    () => ({
      partnerIds: shuffleArray(items.map((p) => p.id)),
      offerKeys: shuffleArray(
        mergeMemberOffersFromParceiros(items).map((o) => o.offerKey)
      ),
    }),
    [items]
  )

  const parceirosMarcas = useMemo(
    () => orderByRankKeys(parceirosFiltrados, shuffleRanks.partnerIds, (p) => p.id),
    [parceirosFiltrados, shuffleRanks]
  )

  const memberOffers = useMemo(() => {
    if (!isMember) return []
    const merged = mergeMemberOffersFromParceiros(parceirosFiltrados)
    return orderByRankKeys(merged, shuffleRanks.offerKeys, (o) => o.offerKey)
  }, [isMember, parceirosFiltrados, shuffleRanks])

  function limparFiltros() {
    setQueryRaw('')
    setCityRaw('')
    setQuery('')
    setCidade('')
    fetchData({ resetPage: true })
  }

  const pagination =
    totalPages > 1 ? (
      <div
        className="mt-3 rounded-[10px] px-4 py-3 flex items-center justify-between gap-3"
        style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--separator, var(--c-border))',
        }}
      >
        <span className="text-[13px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          Página {page + 1} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((pp) => Math.max(0, pp - 1))}
            disabled={page <= 0}
            className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg text-[15px] font-medium disabled:opacity-40 active:opacity-70"
            style={{ color: 'var(--primary)' }}
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} /> Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((pp) => Math.min(totalPages - 1, pp + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg text-[15px] font-medium disabled:opacity-40 active:opacity-70"
            style={{ color: 'var(--primary)' }}
            aria-label="Próxima página"
          >
            Próxima <ChevronRight size={18} />
          </button>
        </div>
      </div>
    ) : null

  if (isMember) {
    return (
      <div className={className}>
        <div className="mb-5">
          <p
            className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Marcas
          </p>
          <MemberParceirosStoryStrip
            parceiros={parceirosMarcas}
            loading={loading}
            detailBase={detailBase}
          />
        </div>

        {!loading && memberOffers.length > 0 ? (
          <div className="mb-6">
            <p
              className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Ofertas
            </p>
            <MemberParceiroOffersFeed
              offers={memberOffers}
              loading={loading}
              detailBase={detailBase}
            />
          </div>
        ) : null}

        <MemberSearchBar
          queryRaw={queryRaw}
          cityRaw={cityRaw}
          onQueryChange={setQueryRaw}
          onCityChange={setCityRaw}
          onClear={limparFiltros}
          count={!loading && !error ? parceirosFiltrados.length : null}
        />

        {loading ? (
          <div className="space-y-3 mt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[160px] animate-pulse rounded-[16px]"
                style={{ background: 'color-mix(in srgb, var(--text) 6%, var(--surface))' }}
              />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div
            className="mt-3 rounded-[16px] px-4 py-8 text-center"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--separator, var(--c-border))',
            }}
          >
            <p className="text-[15px] leading-snug" style={{ color: 'var(--danger, #dc2626)' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchData()}
              className="mt-4 text-[15px] font-semibold min-h-[44px] px-4 active:opacity-70"
              style={{ color: 'var(--primary)' }}
            >
              Tentar de novo
            </button>
          </div>
        ) : null}

        {!loading && !error && parceirosFiltrados.length === 0 ? (
          <div
            className="mt-3 rounded-[16px] px-4 py-8 text-center"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--separator, var(--c-border))',
            }}
          >
            <p className="text-[17px] font-medium leading-snug">Nenhum parceiro encontrado</p>
            <p className="text-[15px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Ajuste a busca ou limpe os filtros.
            </p>
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-4 text-[15px] font-semibold min-h-[44px] px-4 active:opacity-70"
              style={{ color: 'var(--primary)' }}
            >
              Limpar filtros
            </button>
          </div>
        ) : null}

        {!loading && !error && parceirosFiltrados.length > 0 ? (
          <>
            <p
              className="mt-5 mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Todos os parceiros
            </p>
            <div className="space-y-3">
              {parceirosFiltrados.map((p) => (
                <ParceiroMemberFeedCard key={p.id} p={p} detailBase={detailBase} />
              ))}
            </div>
            {pagination}
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className={className}>
      {showIntro ? (
        <p className="mb-4 text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Parceiros com condições especiais para associados. Busque por nome ou cidade.
        </p>
      ) : null}

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

        <button onClick={limparFiltros} className="btn-outline text-sm" title="Limpar filtros">
          <RotateCcw size={16} /> Limpar
        </button>

        <div className="grow" />
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {parceirosFiltrados.length} parceiro(s) nesta página
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--c-border)' }}
            />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
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
            <button type="button" onClick={() => fetchData()} className="btn-primary">
              Tentar de novo
            </button>
          </div>
        </div>
      ) : null}

      {!loading && !error && parceirosFiltrados.length === 0 ? (
        <div
          className="rounded-xl border p-6 text-center"
          style={{ borderColor: 'var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
        >
          Nenhum parceiro encontrado com os filtros atuais.
        </div>
      ) : null}

      {!loading && !error && parceirosFiltrados.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {parceirosFiltrados.map((p) => (
              <ParceiroCard key={p.id} p={p} detailBase={detailBase} />
            ))}
          </div>
          {pagination}
        </>
      ) : null}
    </div>
  )
}
