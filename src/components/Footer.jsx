// src/components/Footer.jsx
import { Link } from "react-router-dom"
import useTenant from "@/store/tenant"

export default function Footer() {
  const empresa = useTenant(s => s.empresa)
  const ano = new Date().getFullYear()

  const nome = empresa?.nomeFantasia || "Empresa"
  const logo = empresa?.urlLogo
  const email = empresa?.contato?.email
  const telefone = empresa?.contato?.telefone

  const end = empresa?.endereco
  const enderecoFormatado = end
    ? `${end.logradouro}, ${end.numero} - ${end.bairro}, ${end.cidade}/${end.uf}`
    : ""

  return (
    <footer className="w-full bg-[var(--surface)] border-t">
      <div className="container-max py-12 grid gap-12 md:grid-cols-3">

        {/* Coluna 1: Logo + Institucional */}
        <div className="flex flex-col gap-4">
          {logo ? (
            <img
              src={logo}
              alt={nome}
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <h2 className="text-lg font-semibold text-[var(--text)]">
              {nome}
            </h2>
          )}

          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {empresa?.razaoSocial || nome}
            <br />
            CNPJ: {empresa?.cnpj}
            <br />
            {enderecoFormatado}
          </p>
        </div>

        {/* Coluna 2: Contatos */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[var(--text)] tracking-wide">
            CONTATO
          </h3>

          <ul className="text-sm text-[var(--text-muted)] flex flex-col gap-2">
            {telefone && (
              <li>
                <a
                  href={`tel:${telefone}`}
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  {telefone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  {email}
                </a>
              </li>
            )}
          </ul>

          <div className="mt-4 flex gap-4">
            <Link
              to="/politica-privacidade"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link
              to="/termos-uso"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Termos de Uso
            </Link>
          </div>
        </div>

        {/* Coluna 3: Mapa e Informações Adicionais */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[var(--text)] tracking-wide">
            LOCALIZAÇÃO
          </h3>

          {end ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${end.latitude},${end.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Ver no mapa →
            </a>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Endereço não informado</p>
          )}
        </div>
      </div>

      <div className="border-t py-6">
        <div className="container-max text-center text-xs text-[var(--text-muted)]">
          © {ano} {nome}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
