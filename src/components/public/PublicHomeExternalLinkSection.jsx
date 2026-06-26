import {
  ArrowUpRight,
  ExternalLink,
  Globe,
  HeartPulse,
  Link2,
  Smartphone,
  Stethoscope,
  Video,
} from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import PublicPageHeader from '@/components/public/PublicPageHeader'

const ICONS = {
  ExternalLink,
  ArrowUpRight,
  Globe,
  Link2,
  Video,
  HeartPulse,
  Stethoscope,
  Smartphone,
}

export default function PublicHomeExternalLinkSection({ section, mounted = true }) {
  if (!section?.href || !section?.title || !section?.ctaLabel) return null

  const Icon = ICONS[section.icon] || ExternalLink
  const headingId = `${section.id}-heading`

  return (
    <section id={section.id} aria-labelledby={headingId}>
      <div
        className={[
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="min-w-0">
            <PublicPageHeader
              kicker={section.kicker}
              title={section.title}
              description={section.subtitle}
              id={headingId}
              titleAs="h2"
              size="compact"
              className="mb-5 md:mb-6 [&_.public-lead]:hidden sm:[&_.public-lead]:block"
            />

            <CTAButton
              as="a"
              href={section.href}
              target={section.openInNewTab ? '_blank' : undefined}
              rel={section.openInNewTab ? 'noopener noreferrer' : undefined}
              size="lg"
              variant={section.ctaVariant === 'outline' ? 'outline' : 'primary'}
              className="w-full sm:w-auto justify-center"
              iconBefore={<Icon size={16} strokeWidth={2.25} aria-hidden="true" />}
              iconAfter={
                section.openInNewTab ? (
                  <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden="true" />
                ) : null
              }
              aria-label={
                section.openInNewTab
                  ? `${section.ctaLabel} (abre em nova aba)`
                  : section.ctaLabel
              }
            >
              {section.ctaLabel}
            </CTAButton>
          </div>

          {section.image ? (
            <div className="min-w-0 lg:justify-self-end">
              <div className="public-surface-card overflow-hidden">
                <img
                  src={section.image}
                  alt={section.imageAlt || section.title}
                  className="w-full max-h-[220px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
