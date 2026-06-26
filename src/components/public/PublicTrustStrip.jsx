import { ShieldCheck, HeartHandshake, Users2 } from 'lucide-react'

import {
  getHomeEditorialTrustItems,
  getHomeTrustStats,
  getTenantContract,
} from '@/lib/tenantContent'
import { usePrimaryColor } from '@/lib/themeColor'

const ICONS = {
  Users2,
  ShieldCheck,
  HeartHandshake,
  Star: ShieldCheck,
  Store: ShieldCheck,
  Clock: ShieldCheck,
}

const MAX_TRUST_SNIPPET = 36

function formatTrustSnippet(text, max = MAX_TRUST_SNIPPET) {
  const s = String(text || '').trim()
  if (!s) return ''
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const base = lastSpace > 16 ? cut.slice(0, lastSpace) : cut
  return `${base.trim()}…`
}

export default function PublicTrustStrip({ compact = false }) {
  const { base } = usePrimaryColor()
  const contract = getTenantContract()
  const stats = getHomeTrustStats(contract)
  const hasStats = Array.isArray(stats) && stats.length >= 2
  const editorial = getHomeEditorialTrustItems(contract)

  const items = hasStats
    ? stats.slice(0, 3).map((s) => ({
        key: `${s.label}-${s.value}`,
        title: s.value,
        text: formatTrustSnippet(s.label),
        icon: ICONS[s.icon] || ShieldCheck,
        isStat: true,
      }))
    : editorial.slice(0, 3).map((e, i) => ({
        key: e.title || i,
        title: e.title,
        text: formatTrustSnippet(e.text),
        icon: [ShieldCheck, HeartHandshake, Users2][i] || ShieldCheck,
        isStat: false,
      }))

  if (items.length < 2) return null

  return (
    <section
      className={compact ? 'mt-3 pt-3 border-t md:mt-5 md:pt-0 md:border-t-0' : 'mt-6 md:mt-10'}
      style={{
        borderColor: compact
          ? 'color-mix(in srgb, var(--c-border) 80%, transparent)'
          : undefined,
      }}
      aria-label="Por que confiar em nós"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:hidden">
        {items.map(({ key, title, icon: Icon }, index) => (
          <span key={key} className="inline-flex items-center gap-1.5 min-w-0">
            {index > 0 ? (
              <span className="text-[var(--text-muted)] opacity-40" aria-hidden="true">
                ·
              </span>
            ) : null}
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: base }} aria-hidden="true" />
            <span className="text-[11px] font-semibold text-[var(--text-muted)] truncate max-w-[28vw]">
              {title}
            </span>
          </span>
        ))}
      </div>

      <div className="hidden md:grid md:grid-cols-3 md:gap-3">
        {items.map(({ key, title, text, icon: Icon, isStat }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 md:p-4 min-h-[52px]"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 14%, var(--c-border))',
              background: 'color-mix(in srgb, var(--surface) 94%, var(--primary) 6%)',
            }}
          >
            <div
              className="h-9 w-9 grid place-items-center rounded-lg shrink-0 md:h-10 md:w-10 md:rounded-xl"
              style={{ backgroundColor: `${base}14` }}
            >
              <Icon className="h-4 w-4 md:h-5 md:w-5" style={{ color: base }} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={
                  isStat
                    ? 'text-base md:text-lg font-extrabold truncate'
                    : 'text-[13px] md:text-sm font-bold leading-snug truncate'
                }
              >
                {title}
              </div>
              {text ? (
                <div className="text-[11px] md:text-xs text-[var(--text-muted)] leading-snug truncate">
                  {text}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
