import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import StoryRingLogo from '@/components/beneficios/StoryRingLogo'
import { fmtBeneficio, mapsLink } from '@/components/beneficios/beneficiosUtils'

function OfferPill({ label, value }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0"
      style={{
        background: 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
        color: 'var(--text)',
        border: '0.5px solid color-mix(in srgb, var(--primary) 18%, transparent)',
      }}
    >
      {label ? `${label} · ` : ''}
      <strong>{value}</strong>
    </span>
  )
}

/** Card rico estilo feed Instagram para listagem completa na área privada. */
export default function ParceiroMemberFeedCard({ p, detailBase = '/area/beneficios' }) {
  const beneficios = Array.isArray(p?.beneficios) ? p.beneficios : []
  const cidade = [p?.endereco?.cidade, p?.endereco?.uf].filter(Boolean).join(' · ')
  const visibleOffers = beneficios.slice(0, 3)
  const extra = Math.max(0, beneficios.length - visibleOffers.length)

  return (
    <article
      className="rounded-[16px] overflow-hidden"
      style={{
        border: '0.5px solid var(--separator, var(--c-border))',
        background: 'var(--surface)',
        boxShadow: '0 1px 3px color-mix(in srgb, var(--text) 5%, transparent)',
      }}
    >
      <Link
        to={`${detailBase}/${p.id}`}
        className="flex items-center gap-3 px-4 py-3 min-h-[72px] active:opacity-80"
      >
        <StoryRingLogo logoUrl={p.imagem} nome={p.nome} size="md" />
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-[17px] font-semibold leading-snug truncate">{p.nome}</span>
          {cidade ? (
            <span className="block text-[13px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {cidade}
            </span>
          ) : null}
        </span>
        <ChevronRight size={18} className="shrink-0 opacity-35" style={{ color: 'var(--text-muted)' }} />
      </Link>

      {visibleOffers.length > 0 ? (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {visibleOffers.map((b, idx) => (
            <OfferPill
              key={b.id ?? idx}
              label={b.descricao}
              value={fmtBeneficio(b)}
            />
          ))}
          {extra > 0 ? (
            <span className="text-[11px] font-semibold self-center px-1" style={{ color: 'var(--primary)' }}>
              +{extra}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className="flex border-t"
        style={{ borderColor: 'var(--separator, var(--c-border))' }}
      >
        <Link
          to={`${detailBase}/${p.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] text-[14px] font-semibold active:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          Ver detalhes
        </Link>
        {p?.endereco ? (
          <a
            href={mapsLink(p.endereco)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 text-[13px] font-medium border-l active:opacity-70"
            style={{
              borderColor: 'var(--separator, var(--c-border))',
              color: 'var(--text-muted)',
            }}
          >
            <MapPin size={15} />
            Mapa
          </a>
        ) : null}
      </div>
    </article>
  )
}
