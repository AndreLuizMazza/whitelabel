// src/components/Footer.jsx
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { ChevronDown, MapPin, Phone, Mail, MessageCircle } from 'lucide-react'

import useTenant from '@/store/tenant'
import {
  getTenantContract,
  isAboutPageVisible,
  getFooterInstitutionalBlurb,
} from '@/lib/tenantContent'
import { getFilteredPublicMenu } from '@/lib/publicMenu'
import {
  PARTNER_HOME_ANCHOR,
  resolvePartnerWhatsAppHref,
} from '@/lib/partnerFunnel'
import AppBuildInfo from '@/components/AppBuildInfo.jsx'

function whatsappHrefFromPhone(telefone) {
  let digits = String(telefone || '').replace(/\D+/g, '')
  if (!digits) return ''
  if (!digits.startsWith('55')) digits = '55' + digits
  return `https://wa.me/${digits}`
}

function FooterLegalLink({ item }) {
  const className = 'site-footer__link text-[13px]'
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {item.label}
      </a>
    )
  }
  if (item.href?.startsWith('/#')) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    )
  }
  return (
    <Link to={item.href || item.to} className={className}>
      {item.label}
    </Link>
  )
}
function FooterLink({ item }) {
  const className = 'site-footer__link w-fit'
  if (item.to.startsWith('/#')) {
    return (
      <a href={item.to} className={className}>
        {item.label}
      </a>
    )
  }
  return (
    <Link to={item.to} className={className}>
      {item.label}
    </Link>
  )
}

function FooterNavGroup({ title, items }) {
  if (!items?.length) return null

  return (
    <>
      <details className="md:hidden border-b border-[color-mix(in_srgb,var(--c-border)_70%,transparent)] py-3.5 group">
        <summary className="flex items-center justify-between gap-3 select-none">
          <span className="site-footer__nav-title">{title}</span>
          <ChevronDown
            className="h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav className="flex flex-col gap-2.5 pt-3 pb-1">
          {items.map((item) => (
            <FooterLink key={item.key} item={item} />
          ))}
        </nav>
      </details>

      <div className="hidden md:block">
        <p className="site-footer__nav-title">{title}</p>
        <nav className="mt-4 flex flex-col gap-2.5">
          {items.map((item) => (
            <FooterLink key={item.key} item={item} />
          ))}
        </nav>
      </div>
    </>
  )
}

export default function Footer() {
  const empresa = useTenant((s) => s.empresa)
  const ano = new Date().getFullYear()

  const nome = empresa?.nomeFantasia || 'Empresa'
  const logo = empresa?.urlLogo
  const email = empresa?.contato?.email
  const telefone = empresa?.contato?.telefone
  const whatsappHref = useMemo(() => whatsappHrefFromPhone(telefone), [telefone])

  const end = empresa?.endereco
  const enderecoLinha1 = end ? `${end.logradouro}, ${end.numero}` : ''
  const enderecoLinha2 = end ? `${end.bairro} • ${end.cidade} - ${end.uf}` : ''
  const hasEndereco = Boolean(enderecoLinha1 || enderecoLinha2)

  const menuLinks = useMemo(() => getFilteredPublicMenu(empresa), [empresa])
  const institucionalKeys = ['home', 'planos', 'produtos', 'sobre-nos']
  const servicosKeys = ['beneficios', 'memorial', 'segunda-via', 'contatos', 'ajuda']

  const footerBlurb = useMemo(() => {
    const fromTenant = getFooterInstitutionalBlurb(getTenantContract())
    if (fromTenant) return fromTenant
    return 'Assistência familiar, benefícios e atendimento humanizado para você e sua família.'
  }, [empresa])

  const institucional = menuLinks.filter((item) => institucionalKeys.includes(item.key))
  const servicos = menuLinks.filter((item) => servicosKeys.includes(item.key))

  const partnerLegalLink = useMemo(() => {
    const wa = resolvePartnerWhatsAppHref(empresa)
    if (wa) {
      return { href: wa, label: 'Parcerias comerciais', external: true }
    }
    return { href: PARTNER_HOME_ANCHOR, label: 'Parcerias comerciais', external: false }
  }, [empresa])

  const legalLinks = [
    isAboutPageVisible(getTenantContract()) ? { href: '/sobre-nos', label: 'Sobre nós' } : null,
    { href: '/politica-privacidade', label: 'Privacidade' },
    { href: '/politica-cookies', label: 'Cookies' },
    partnerLegalLink,
  ].filter(Boolean)

  return (
    <footer className="site-footer w-full mt-10 md:mt-16">
      <div className="container-max pt-10 md:pt-12 pb-8">
        <div
          className="flex flex-col gap-5 rounded-2xl border px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-7"
          style={{
            borderColor: 'color-mix(in srgb, var(--primary) 18%, var(--c-border))',
            background: 'color-mix(in srgb, var(--surface) 88%, var(--primary) 12%)',
          }}
        >
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Pronto para começar?
            </p>
            <h2 className="mt-1.5 text-lg md:text-xl font-semibold tracking-tight text-[var(--text)]">
              Proteção e tranquilidade para quem você ama
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
              Contrate online em minutos ou fale com nossa equipe de atendimento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/planos" className="site-footer__cta">
              Ver planos
            </Link>
            <Link to="/filiais" className="site-footer__contact-pill">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Fale conosco
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            {logo ? (
              <img
                src={logo}
                alt={nome}
                className="h-9 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-base font-semibold tracking-tight text-[var(--text)]">{nome}</span>
            )}
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] max-w-sm">{footerBlurb}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {telefone && (
                <a href={`tel:${telefone}`} className="site-footer__contact-pill">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {telefone}
                </a>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer__contact-pill"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  WhatsApp
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="site-footer__contact-pill">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  E-mail
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 grid gap-0 md:grid-cols-3 md:gap-8">
            <FooterNavGroup title="Institucional" items={institucional} />
            <FooterNavGroup title="Serviços" items={servicos} />

            <div className="hidden md:block">
              <p className="site-footer__nav-title">Contato</p>
              <div className="mt-4 space-y-2.5 text-sm">
                {telefone && (
                  <a href={`tel:${telefone}`} className="site-footer__link block">
                    {telefone}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="site-footer__link block">
                    {email}
                  </a>
                )}
                {hasEndereco && (
                  <div className="site-footer__fine-print pt-1">
                    {enderecoLinha1 && <div>{enderecoLinha1}</div>}
                    {enderecoLinha2 && <div>{enderecoLinha2}</div>}
                  </div>
                )}
                {end?.latitude && end?.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${end.latitude},${end.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="site-footer__link inline-flex items-center gap-1.5 mt-2"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Ver no mapa
                  </a>
                )}
              </div>
            </div>

            <details className="md:hidden border-b border-[color-mix(in_srgb,var(--c-border)_70%,transparent)] py-3.5 group">
              <summary className="flex items-center justify-between gap-3 select-none">
                <span className="site-footer__nav-title">Contato</span>
                <ChevronDown
                  className="h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="space-y-2.5 pt-3 pb-1 text-sm">
                {telefone && (
                  <a href={`tel:${telefone}`} className="site-footer__link block">
                    {telefone}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="site-footer__link block">
                    {email}
                  </a>
                )}
                {hasEndereco && (
                  <div className="site-footer__fine-print">
                    {enderecoLinha1 && <div>{enderecoLinha1}</div>}
                    {enderecoLinha2 && <div>{enderecoLinha2}</div>}
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--c-border)_75%,transparent)]">
        <div className="container-max py-6 md:py-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text)]">{empresa?.razaoSocial || nome}</p>
              {empresa?.cnpj && (
                <p className="site-footer__fine-print mt-1 uppercase tracking-wide">CNPJ {empresa.cnpj}</p>
              )}
              <p className="site-footer__fine-print mt-2 max-w-2xl">
                Os serviços descritos neste site estão sujeitos à disponibilidade regional e às condições
                contratuais de cada plano.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-5 gap-y-2 shrink-0">
              {legalLinks.map((item) => (
                <FooterLegalLink key={item.label} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--c-border)_60%,transparent)] bg-[color-mix(in_srgb,var(--surface-alt,var(--surface))_92%,var(--text)_8%)]">
        <div className="container-max py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="site-footer__fine-print flex flex-col gap-1.5">
            <span>
              © {ano} {nome}. Todos os direitos reservados.
            </span>
            <AppBuildInfo variant="full" className="tabular-nums opacity-75" />
          </div>
          <a
            href="https://progem.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__link text-[13px] shrink-0"
          >
            Desenvolvido por Progem
          </a>
        </div>
      </div>
    </footer>
  )
}
