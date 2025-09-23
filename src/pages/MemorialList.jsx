import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listMemorial } from '@/lib/nalapide'
import {
  Search, Eye, Calendar, Cake, HeartCrack, Sun,
  RefreshCcw, Loader2, Info, Flower2, Sprout
} from 'lucide-react'
import { safeYmd, isSameDay, isSameMonthDay, addDays, fmtBR } from '@/lib/dateUtils'

/* ================= Utils ================= */
function fmtDate(d) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    const fixed = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
    return fixed.toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}
function byNome(a, b) {
  const na = (a.nomeFalecido || a.nome || '').toLowerCase()
  const nb = (b.nomeFalecido || b.nome || '').toLowerCase()
  return na.localeCompare(nb)
}

/* ================= Micro UI ================= */
function StatPill({ icon: Icon, label, value }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1"
      style={{
        background: 'var(--primary-12)',
        color: 'var(--text)',
        boxShadow: '0 0 0 1px color-mix(in srgb, var(--primary) 15%, transparent) inset'
      }}
    >
      <Icon className="h-4 w-4" style={{ color: 'var(--primary)' }} />
      <span className="tabular-nums font-semibold">{value}</span>
      <span className="opacity-80">{label}</span>
    </div>
  )
}

function ChipFilter({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm transition"
      style={{
        background: active ? 'var(--primary)' : 'var(--surface)',
        color:      active ? 'var(--on-primary)' : 'var(--text)',
        border:     `1px solid ${active ? 'color-mix(in srgb, var(--primary) 40%, transparent)' : 'var(--c-border)'}`
      }}
    >
      {children}
    </button>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 animate-pulse"
      style={{ background: 'var(--surface)', border: '1px solid var(--c-border)' }}
    >
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full" style={{ background: 'var(--surface-alt)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded" style={{ background: 'var(--surface-alt)' }} />
          <div className="h-3 w-1/3 rounded" style={{ background: 'var(--surface-alt)' }} />
          <div className="h-3 w-1/4 rounded" style={{ background: 'var(--surface-alt)' }} />
        </div>
      </div>
    </div>
  )
}

function MemorialCard({ it }) {
  const nome = it.nomeFalecido || it.nome || 'Sem nome'
  const nasc = fmtDate(it.dtNascimento)
  const fale = fmtDate(it.dtFalecimento)
  const views = Number(it.contadorAcessos ?? 0)

  return (
    <div
      className="rounded-2xl p-4 shadow-sm hover:shadow transition"
      style={{ background: 'var(--surface)', border: '1px solid var(--c-border)' }}
    >
      <div className="flex items-center gap-3">
        {it.fotoUrl ? (
          <img
            src={it.fotoUrl}
            alt={nome}
            className="h-14 w-14 rounded-full object-cover"
            style={{ boxShadow: '0 0 0 2px #fff inset' }}
          />
        ) : (
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center font-semibold"
            style={{ background: 'var(--primary-12)', color: 'var(--primary)' }}
          >
            {nome.slice(0, 1)}
          </div>
        )}

        <div className="min-w-0">
          <h3 className="font-semibold leading-tight truncate" style={{ color: 'var(--text)' }}>{nome}</h3>
          <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{nasc} – {fale}</p>
          <p className="mt-0.5 text-xs flex items-center gap-1" style={{ color: 'var(--text)' }}>
            <Eye className="h-3.5 w-3.5" />
            <span>{views} visualiza{views === 1 ? 'ção' : 'ções'}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================= Página ================= */
export default function MemorialList() {
  const [qp, setQp] = useSearchParams()
  const qInit = qp.get('q') || ''

  const [q, setQ] = useState(qInit)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  /* ---------- BUSCA (debounce + submit) ---------- */
  const debounceRef = useRef(null)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      load()
    }, 450)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await listMemorial({ q })
      const items = data?.items || data?.rows || data?.content || data || []
      setRows(Array.isArray(items) ? items : [])

      setQp(prev => {
        const n = new URLSearchParams(prev)
        q ? n.set('q', q) : n.delete('q')
        return n
      })
    } catch (e) {
      console.error('[MemorialList] load error', e)
      setError('Não foi possível carregar o memorial.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e?.preventDefault?.()
    clearTimeout(debounceRef.current)
    load()
  }

  function handleClear() {
    setQ('')
    clearTimeout(debounceRef.current)
    load()
  }

  /* ---------- Destaques & Estatísticas ---------- */
  const today = new Date()
  const withDates = rows.map(it => ({ ...it, _nasc: safeYmd(it.dtNascimento), _fale: safeYmd(it.dtFalecimento) }))

  const falecidosHoje = withDates.filter(it => it._fale && isSameDay(it._fale, today)).sort(byNome)
  const aniversarioNasc = withDates.filter(it => it._nasc && isSameMonthDay(it._nasc, today)).sort(byNome)
  const aniversarioFal = withDates.filter(it => it._fale && isSameMonthDay(it._fale, today)).sort(byNome)
  const setimoDia = withDates.filter(it => it._fale && isSameDay(addDays(it._fale, 7), today)).sort(byNome)

  const stats = {
    hoje: falecidosHoje.length,
    nasc: aniversarioNasc.length,
    fal: aniversarioFal.length,
    setimo: setimoDia.length
  }

  const filteredRows =
    tab === 'today' ? falecidosHoje :
    tab === 'nasc'  ? aniversarioNasc :
    tab === 'fal'   ? aniversarioFal :
    tab === 'setimo'? setimoDia :
    rows

  const empty = !loading && filteredRows.length === 0

  return (
    <div className="container-max py-8">
      {/* ===== HERO / Cabeçalho ===== */}
      <div
        className="relative overflow-hidden rounded-3xl mb-6"
        style={{ border: '1px solid var(--c-border)', background: 'var(--surface)' }}
      >
        {/* glow leve */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(800px circle at 12% 20%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 40%), radial-gradient(700px circle at 90% 30%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 40%)'
          }}
        />
        <div className="px-4 md:px-6 pt-5 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Flower2 className="h-5 w-5" />
                <span className="uppercase tracking-wide text-xs font-semibold">Memorial</span>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                Memoriais Públicos
              </h1>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                <Calendar className="inline h-4 w-4 mr-1 -mt-0.5" />
                Hoje é <strong>{fmtBR(new Date())}</strong>.
              </p>
            </div>

            {/* Busca */}
            <form onSubmit={handleSubmit} className="w-full lg:w-[420px]">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="input w-full pl-10"
                    placeholder="Buscar por nome…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text)' }}
                      title="Limpar"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button type="submit" className="btn-primary shrink-0" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Buscar
                </button>
              </div>
            </form>
          </div>

          {/* Estatísticas */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatPill icon={Sun}        label="Falecidos hoje"     value={stats.hoje} />
            <StatPill icon={Cake}       label="Aniv. nascimento"   value={stats.nasc} />
            <StatPill icon={HeartCrack} label="Aniv. falecimento"  value={stats.fal} />
            <StatPill icon={Sprout}     label="Sétimo dia"         value={stats.setimo} />
          </div>

          {/* filtros locais */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ChipFilter active={tab==='all'}    onClick={() => setTab('all')}>Todos</ChipFilter>
              <ChipFilter active={tab==='today'}  onClick={() => setTab('today')}>Hoje</ChipFilter>
              <ChipFilter active={tab==='nasc'}   onClick={() => setTab('nasc')}>Nasc.</ChipFilter>
              <ChipFilter active={tab==='fal'}    onClick={() => setTab('fal')}>Falec.</ChipFilter>
              <ChipFilter active={tab==='setimo'} onClick={() => setTab('setimo')}>7º dia</ChipFilter>
            </div>
            <div className="text-sm" style={{ color: 'var(--text)' }}>
              Exibindo <strong>{filteredRows.length}</strong> resultados
            </div>
          </div>
        </div>
      </div>

      {/* ===== Estados ===== */}
      {error && (
        <p className="mb-4 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <Info className="h-4 w-4" /> {error}
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !filteredRows.length && (
        <div className="text-center py-16">
          <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
               style={{ background: 'var(--primary-12)', color: 'var(--primary)' }}>
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-medium" style={{ color: 'var(--text)' }}>Nenhum memorial encontrado</h3>
          <p className="mt-1" style={{ color: 'var(--text)' }}>Ajuste a busca ou altere os filtros.</p>
          <button className="btn-outline mt-4" onClick={handleClear}>Limpar filtros</button>
        </div>
      )}

      {/* ===== Grid principal ===== */}
      {!loading && !!filteredRows.length && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRows.map((it) => (
              <Link key={it.id || it.slug} to={`/memorial/${it.slug || it.id}`}>
                <MemorialCard it={it} />
              </Link>
            ))}
          </div>

          {tab !== 'all' && (
            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text)' }}>
              * Filtro aplicado apenas sobre os resultados carregados.
            </p>
          )}
        </>
      )}
    </div>
  )
}
