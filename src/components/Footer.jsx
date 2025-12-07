// src/components/Footer.jsx
import { Link } from "react-router-dom"
import useTenant from "@/store/tenant"

export default function Footer() {
  const empresa = useTenant((s) => s.empresa)
  const ano = new Date().getFullYear()

  const nome = empresa?.nomeFantasia || "Empresa"
  const logo = empresa?.urlLogo
  const email = empresa?.contato?.email
  const telefone = empresa?.contato?.telefone

  const end = empresa?.endereco
  const enderecoLinha1 = end
    ? `${end.logradouro}, ${end.numero}`
    : ""
  const enderecoLinha2 = end
    ? `${end.bairro} • ${end.cidade} - ${end.uf}`
    : ""

  const hasEndereco = Boolean(enderecoLinha1 || enderecoLinha2)

  return (
    <footer className="w-full border-t bg-[var(--surface)]">
      {/* Faixa superior com logo e navegação institucional */}
      <div className="container-max py-10 border-b border-[color-mix(in_srgb,var(--c-border)_80%,transparent)]">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={nome}
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-medium tracking-wide text-[var(--text)]">
                {nome}
              </span>
            )}
          </div>

          <nav className="flex flex-col gap-2 text-xs text-[var(--text-muted)] md:flex-row md:items-center md:gap-6">
            <Link
              to="/politica-privacidade"
              className="hover:text-[var(--text)] transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link
              to="/termos-uso"
              className="hover:text-[var(--text)] transition-colors"
            >
              Termos de Uso
            </Link>
            <Link
              to="/politica-cookies"
              className="hover:text-[var(--text)] transition-colors"
            >
              Cookies
            </Link>
          </nav>
        </div>
      </div>

      {/* Faixa intermediária com informações da empresa */}
      <div className="container-max py-8 border-b border-[color-mix(in_srgb,var(--c-border)_60%,transparent)]">
        <div className="grid gap-6 text-xs text-[var(--text-muted)] md:grid-cols-3">
          <div className="space-y-1">
            <div className="font-medium text-[var(--text)]">
              {empresa?.razaoSocial || nome}
            </div>
            {empresa?.cnpj && (
              <div className="text-[11px] uppercase tracking-wide">
                CNPJ {empresa.cnpj}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted-soft)]">
              CONTATO
            </div>
            {telefone && (
              <a
                href={`tel:${telefone}`}
                className="block hover:text-[var(--text)] transition-colors"
              >
                {telefone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="block hover:text-[var(--text)] transition-colors"
              >
                {email}
              </a>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted-soft)]">
              ENDEREÇO
            </div>
            {hasEndereco ? (
              <>
                {enderecoLinha1 && <div>{enderecoLinha1}</div>}
                {enderecoLinha2 && <div>{enderecoLinha2}</div>}
              </>
            ) : (
              <div>Endereço não informado</div>
            )}
          </div>
        </div>
      </div>

      {/* Faixa inferior com copyright e localização/mapa */}
      <div className="container-max py-6 text-[11px] text-[var(--text-muted)] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-x-1">
          <span>© {ano} {nome}.</span>
          <span>Todos os direitos reservados.</span>
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
