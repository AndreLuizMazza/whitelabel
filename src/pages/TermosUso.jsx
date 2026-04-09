// src/pages/TermosUso.jsx
import { useEffect } from 'react'
import useTenant from '@/store/tenant'
import { applyStaticPageTitle } from '@/lib/shellBranding'
import { formatEndereco, hojeISO } from '@/lib/format'

export default function TermosUso() {
  const empresa = useTenant(s => s.empresa)
  const nomeFantasia = empresa?.nomeFantasia || 'Nossa Empresa'
  const razaoSocial = empresa?.razaoSocial || nomeFantasia
  const cnpj = empresa?.cnpj || '00.000.000/0000-00'
  const email = empresa?.contato?.email || 'contato@empresa.com'
  const telefone = empresa?.contato?.telefone || '(00) 0000-0000'
  const endereco = formatEndereco(empresa)
  const foro = (empresa?.endereco?.cidade && empresa?.endereco?.uf)
    ? `${empresa.endereco.cidade}/${empresa.endereco.uf}`
    : 'Comarca da sede da empresa'

  useEffect(() => {
    applyStaticPageTitle('Termos de Uso', empresa)
  }, [empresa])

  if (!empresa) {
    return (
      <div className="container-max py-10">
        <h1 className="text-2xl font-semibold">Termos de Uso</h1>
        <p className="mt-3 text-muted-foreground">Carregando informações da unidade…</p>
      </div>
    )
  }

  return (
    <div className="container-max py-10 prose max-w-none">
      <h1>Termos de Uso – {nomeFantasia} </h1>
      <p><strong>Última atualização:</strong> {hojeISO()}</p>

      <h2>1. Aceitação</h2>
      <p>Ao acessar e utilizar este site, você concorda integralmente com estes Termos de Uso e com a Política de Privacidade.</p>

      <h2>2. Serviços e conteúdo</h2>
      <p>Este site disponibiliza informações institucionais, produtos e/ou serviços, que podem ser atualizados, alterados ou descontinuados a qualquer momento, sem aviso prévio.</p>

      <h2>3. Responsabilidades do usuário</h2>
      <ul>
        <li>Fornecer informações verdadeiras e atualizadas quando solicitado;</li>
        <li>Não utilizar o site para fins ilícitos, abusivos ou que violem direitos de terceiros;</li>
        <li>Respeitar direitos de propriedade intelectual sobre conteúdos, marcas e código-fonte.</li>
      </ul>

      <h2>4. Propriedade intelectual</h2>
      <p>Todo o conteúdo exibido neste site (textos, imagens, logotipos, layout, código) é de titularidade da <strong>{razaoSocial}</strong> ou licenciado, sendo vedada a reprodução sem autorização.</p>

      <h2>5. Limitação de responsabilidade</h2>
      <p>Empregamos esforços para manter o site disponível e seguro, mas não garantimos operação ininterrupta, isenta de erros ou imune a incidentes.</p>

      <h2>6. Links de terceiros</h2>
      <p>Links para sites de terceiros podem ser fornecidos apenas para conveniência. Não nos responsabilizamos por seus conteúdos ou práticas.</p>

      <h2>7. Alterações dos Termos</h2>
      <p>Podemos alterar estes Termos a qualquer momento. O uso continuado do site após publicadas as mudanças implica aceitação da versão vigente.</p>

      <h2>8. Contato e informações da empresa</h2>
      <ul>
        <li><strong>Razão Social:</strong> {razaoSocial}</li>
        <li><strong>CNPJ:</strong> {cnpj}</li>
        <li><strong>Endereço:</strong> {endereco}</li>
        <li><strong>Contato:</strong> 📞 {telefone} | ✉️ {email}</li>
      </ul>

      <h2>9. Foro</h2>
      <p>Fica eleito o foro de <strong>{foro}</strong>, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir dúvidas oriundas destes Termos.</p>
    </div>
  )
}
