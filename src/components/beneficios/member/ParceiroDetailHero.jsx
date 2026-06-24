import { Share2 } from 'lucide-react'
import StoryRingLogo from '@/components/beneficios/StoryRingLogo'
import OfferMediaSurface from '@/components/beneficios/OfferMediaSurface'

/** Hero editorial do parceiro — capa, avatar Stories e ações (estilo Meta/Apple). */
export default function ParceiroDetailHero({
  nome,
  meta,
  logoUrl,
  capaUrl,
  onShare,
}) {
  return (
    <div
      className="relative mb-5 overflow-hidden rounded-[22px]"
      style={{
        border: '0.5px solid var(--separator, var(--c-border))',
        boxShadow: '0 2px 12px color-mix(in srgb, var(--text) 8%, transparent)',
      }}
    >
      <div className="relative h-[min(220px,42vw)] min-h-[200px]">
        <OfferMediaSurface
          capaUrl={capaUrl}
          logoUrl={logoUrl}
          nome={nome}
          variant="hero"
          className="h-full w-full"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 42%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-[36px] text-[13px] font-semibold active:scale-95 transition-transform"
            style={{
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.18)',
              border: '0.5px solid rgba(255, 255, 255, 0.32)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            aria-label="Compartilhar parceiro"
          >
            <Share2 size={15} strokeWidth={2.25} />
            Compartilhar
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end gap-3 p-4">
          <StoryRingLogo logoUrl={logoUrl} nome={nome} size="lg" variant="story" />
          <div className="min-w-0 flex-1 pb-0.5">
            <h1 className="text-[22px] font-bold leading-[1.12] tracking-tight text-white line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
              {nome}
            </h1>
            {meta ? (
              <p className="mt-1 text-[13px] leading-snug text-white/88 line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {meta}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
