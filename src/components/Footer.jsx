// src/components/Footer.jsx
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import useTenant from '@/store/tenant'
import { getTenantContract, isAboutPageVisible } from '@/lib/tenantContent'
import { getFilteredPublicMenu } from '@/lib/publicMenu'
import AppBuildInfo from '@/components/AppBuildInfo.jsx'

function whatsappHrefFromPhone(telefone) {
  let digits = String(telefone || '').replace(/\D+/g, '')
  if (!digits) return ''
  if (!digits.startsWith('55')) digits = '55' + digits
  return `https://wa.me/${digits}`
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

  const institucional = menuLinks.filter((item) => institucionalKeys.includes(item.key))
  const servicos = menuLinks.filter((item) => servicosKeys.includes(item.key))

  return (
    <footer className="w-full border-t bg-[var(--surface)]">
      <div className="container-max py-10 md:py-12 border-b border-[color-mix(in_srgb,var(--c-border)_80%,transparent)]">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            {logo ? (
              <img
                src={logo}
                alt={nome}
                className="h-9 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-semibold tracking-wide text-[var(--text)]">
                {nome}
              </span>
            )}
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)] max-w-xs">
              Assistência familiar, benefícios e atendimento humanizado para você e sua família.
            </p>
          </div>

          {institucional.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--text-muted-soft)]">
                Institucional
              </p>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-[var(--text-muted)]">
                {institucional.map((item) =>
                  item.to.startsWith('/#') ? (
                    <a
                      key={item.key}
                      href={item.to}
                      className="hover:text-[var(--text)] transition-colors w-fit"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.key}
                      to={item.to}
                      className="hover:text-[var(--text)] transition-colors w-fit"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </nav>
            </div>
          )}

          {servicos.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--text-muted-soft)]">
                Serviços
              </p>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-[var(--text-muted)]">
                {servicos.map((item) =>
                  item.to.startsWith('/#') ? (
                    <a
                      key={item.key}
                      href={item.to}
                      className="hover:text-[var(--text)] transition-colors w-fit"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.key}
                      to={item.to}
                      className="hover:text-[var(--text)] transition-colors w-fit"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </nav>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--text-muted-soft)]">
              Contato
            </p>
            <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
              {telefone && (
                <a href={`tel:${telefone}`} className="block hover:text-[var(--text)] transition-colors">
                  {telefone}
                </a>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-[var(--text)] transition-colors"
                >
                  WhatsApp
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="block hover:text-[var(--text)] transition-colors">
                  {email}
                </a>
              )}
              {hasEndereco && (
                <div className="pt-1 text-xs leading-relaxed">
                  {enderecoLinha1 && <div>{enderecoLinha1}</div>}
                  {enderecoLinha2 && <div>{enderecoLinha2}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-max py-6 border-b border-[color-mix(in_srgb,var(--c-border)_60%,transparent)]">
        <div className="grid gap-4 text-xs text-[var(--text-muted)] md:grid-cols-2">
          <div>
            <div className="font-medium text-[var(--text)]">
              {empresa?.razaoSocial || nome}
            </div>
            {empresa?.cnpj && (
              <div className="mt-1 text-[11px] uppercase tracking-wide">
                CNPJ {empresa.cnpj}
              </div>
            )}
          </div>

          <nav className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            {isAboutPageVisible(getTenantContract()) && (
              <Link to="/sobre-nos" className="hover:text-[var(--text)] transition-colors">
                Sobre nós
              </Link>
            )}
            <Link to="/politica-privacidade" className="hover:text-[var(--text)] transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/politica-cookies" className="hover:text-[var(--text)] transition-colors">
              Cookies
            </Link>
          </nav>
        </div>
      </div>

      <div className="container-max py-6 text-[11px] text-[var(--text-muted)] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:gap-1">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
            <span>© {ano} {nome}. Todos os direitos reservados.</span>
            <span className="hidden md:inline">•</span>
            <a
              href="https://progem.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text)] transition-colors"
            >
              Desenvolvido por Progem
            </a>
          </div>
          <AppBuildInfo variant="full" className="text-[10px] tabular-nums opacity-80" />
        </div>

        {end?.latitude && end?.longitude && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${end.latitude},${end.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text)] transition-colors"
          >
            Ver localização no mapa
          </a>
        )}
      </div>
    </footer>
  )
}
