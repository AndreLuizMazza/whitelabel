import { Users2, Store, Star, ShieldCheck, Clock, HeartHandshake } from 'lucide-react'

import { getHomeTrustStats, getTenantContract } from '@/lib/tenantContent'
import { usePrimaryColor } from '@/lib/themeColor'

const ICONS = {
  Users2,
  Store,
  Star,
  ShieldCheck,
  Clock,
  HeartHandshake,
}

export default function PublicTrustStrip() {
  const { base } = usePrimaryColor()
  const stats = getHomeTrustStats(getTenantContract())

  if (!Array.isArray(stats) || stats.length < 2) return null

  return (
    <section className="mt-8 md:mt-10" aria-label="Indicadores de confiança">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.slice(0, 3).map(({ label, value, icon }) => {
          const Icon = ICONS[icon] || ShieldCheck
          return (
            <div
              key={`${label}-${value}`}
              className="flex items-center gap-3 rounded-2xl bg-[var(--surface)]/90 p-4 border shadow-sm"
              style={{ borderColor: 'color-mix(in srgb, var(--primary) 16%, var(--c-border))' }}
            >
              <div
                className="h-10 w-10 grid place-items-center rounded-xl shrink-0"
                style={{ backgroundColor: `${base}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: base }} />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-extrabold truncate">{value}</div>
                <div className="text-xs text-[var(--text-muted)]">{label}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
