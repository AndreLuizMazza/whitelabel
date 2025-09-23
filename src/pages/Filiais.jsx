import { useEffect, useMemo, useState } from 'react'
import { MapPin, Phone, Mail, Building2 } from 'lucide-react'
import api from '@/lib/api'

/** -------------------- Helpers -------------------- */
function maskCnpj(v) {
  if (!v) return '—'
  const s = String(v).replace(/\D/g, '').padStart(14, '0').slice(-14)
  return s.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}
function telHref(tel) {
  if (!tel) return undefined
  const digits = String(tel).replace(/\D/g, '')
  return digits ? `tel:${digits}` : undefined
}
function mapsHref(end) {
  if (!end) return undefined
  const parts = [
    end.logradouro && `${end.logradouro}, ${end.numero || ''}`.trim(),
    end.bairro,
    end.cidade,
    end.uf,
    end.cep && `CEP ${end.cep}`,
  ].filter(Boolean)
  const q = encodeURIComponent(parts.join(', '))
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function ActionPill({ href, label, children }) {
  const Comp = href ? 'a' : 'button'
  return (
    <Comp
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors btn-outline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      title={label}
      aria-label={label}
    >
      {children}
    </Comp>
  )
}

/** -------------------- Card de Unidade -------------------- */
function UnidadeCard({ u }) {
  // Preferir tokens do tenant; se a API trouxer cores próprias da unidade, usar como override
  const cor  = u?.corPrincipal  || 'var(--primary)'
  const cor2 = u?.corSecundaria || 'var(--primary-dark)'
  const cityUf = [u?.endereco?.cidade, u?.endereco?.uf].filter(Boolean).join(' • ')

  return (
    <article
      className="group rounded-2xl border bg-[var(--surface)] overflow-hidden shadow-sm hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-[color:color-mix(in_srgb,var(--primary)_35%,transparent)]"
      style={{ borderColor: 'var(--c-border)' }}
    >
      {/* Header */}
      <div className="p-6 border-b text-center" style={{ borderColor: 'var(--c-border)' }}>
        {u?.urlLogo ? (
          <div className="mx-auto relative w-44 h-20 md:w-52 md:h-24">
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-md opacity-40"
              style={{ background: `linear-gradient(135deg, ${cor}22, ${cor2}22)` }}
              aria-hidden
            />
            <div className="relative h-full w-full rounded-xl bg-[var(--surface)] grid place-items-center shadow-sm p-3 md:p-4 border" style={{ borderColor: 'var(--c-border)' }}>
              <img
                src={u.urlLogo}
                alt={u?.nomeFantasia || 'Unidade'}
                className="max-h-[56px] md:max-h-[72px] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        ) : (
          <div
            className="mx-auto w-44 h-20 md:w-52 md:h-24 rounded-xl grid place-items-center text-white text-2xl font-bold shadow-sm"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor2})` }}
            aria-label={u?.nomeFantasia || 'Unidade'}
          >
            {String(u?.nomeFantasia || 'U').slice(0, 1)}
          </div>
        )}

        <div className="mt-3 space-y-0.5">
          <h3 className="text-base md:text-lg font-semibold leading-snug break-words">{u?.nomeFantasia || 'Unidade'}</h3>
          <p className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>{maskCnpj(u?.cnpj)}</p>

          {cityUf && (
            <div className="mt-1 inline-flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--primary) 6%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                  color: 'var(--primary-dark)',
                }}
                title={cityUf}
              >
                {cityUf}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 grid gap-3">
        <div className="flex items-start gap-2">
          <MapPin className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <div className="text-sm leading-tight">
            <div className="font-medium" style={{ color: 'var(--text)' }}>
              {u?.endereco?.logradouro && `${u.endereco.logradouro}, `}
              {u?.endereco?.numero}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              {[u?.endereco?.bairro, u?.endereco?.cidade, u?.endereco?.uf].filter(Boolean).join(' • ')}
            </div>
            {u?.endereco?.cep && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>CEP {u.endereco.cep}</div>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionPill href={telHref(u?.contato?.telefone)} label="Ligar">
            <Phone className="h-3.5 w-3.5" />
            {u?.contato?.telefone || 'Telefone'}
          </ActionPill>

          <ActionPill href={u?.contato?.email ? `mailto:${u.contato.email}` : undefined} label="E-mail">
            <Mail className="h-3.5 w-3.5" />
            {u?.contato?.email || 'E-mail'}
          </ActionPill>

          <ActionPill href={u?.endereco ? mapsHref(u.endereco) : undefined} label="Ver no mapa">
            <Building2 className="h-3.5 w-3.5" />
            Ver no mapa
          </ActionPill>
        </div>
      </div>

      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${cor}, ${cor2})` }} />
    </article>
  )
}

/** -------------------- Página Filiais -------------------- */
export default function Filiais() {
  const [unidades, setUnidades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        // 1) cache injetado (opcional)
        const cached = window.__tenant?.unidades || window.__tenant?.filiais
        if (mounted && Array.isArray(cached) && cached.length) {
          setUnidades(cached)
          setLoading(false)
          return
        }

        // 2) tenta via BFF/API com axios `api` (herda headers/cookies)
        const tryGet = async (url) => {
          const r = await api.get(url).catch(() => null)
          const data = r?.data
          return Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : null
        }

        const candidates = [
          '/api/progem/unidades',   // BFF
          '/api/v1/unidades/all',   // API direta (se exposta)
        ]

        let data = null
        for (const url of candidates) {
          // eslint-disable-next-line no-await-in-loop
          const arr = await tryGet(url)
          if (arr) { data = arr; break }
        }

        if (mounted) {
          setUnidades(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      } catch {
        if (mounted) {
          setUnidades([])
          setLoading(false)
        }
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const sorted = useMemo(
    () => [...unidades].sort((a, b) =>
      String(a?.nomeFantasia || '').localeCompare(String(b?.nomeFantasia || ''))
    ),
    [unidades]
  )

  return (
    <section className="section">
      <div className="container-max max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Nossas Unidades</h1>
          <p style={{ color: 'var(--text-muted)' }}>Endereços, contatos e mapa.</p>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl border animate-pulse"
                style={{ background: 'var(--surface)', borderColor: 'var(--c-border)' }}
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="rounded-xl border p-6 text-center"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            Nenhuma unidade encontrada.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((u) => (
              <UnidadeCard key={u.id || u.cnpj || u.nomeFantasia} u={u} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
