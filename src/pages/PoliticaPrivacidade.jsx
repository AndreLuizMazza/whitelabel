// src/pages/PoliticaPrivacidade.jsx
import { useEffect } from 'react'
import useTenant from '@/store/tenant'
import { applyStaticPageTitle } from '@/lib/shellBranding'
import { formatEndereco, hojeISO } from '@/lib/format'

export default function PoliticaPrivacidade() {
  const empresa = useTenant(s => s.empresa)
  const nomeFantasia = empresa?.nomeFantasia || 'Nossa Empresa'
  const razaoSocial = empresa?.razaoSocial || nomeFantasia
  const cnpj = empresa?.cnpj || '00.000.000/0000-00'
  const email = empresa?.contato?.email || 'contato@empresa.com'
  const telefone = empresa?.contato?.telefone || '(00) 0000-0000'
  const endereco = formatEndereco(empresa)
  const cidadeUF = empresa?.endereco?.cidade && empresa?.endereco?.uf
    ? `${empresa.endereco.cidade}/${empresa.endereco.uf}`
    : undefined

  useEffect(() => {
    applyStaticPageTitle('Política de Privacidade', empresa)
  }, [empresa])

  if (!empresa) {
    return (
      <div className="container-max py-10">
        <h1 className="text-2xl font-semibold">Política de Privacidade</h1>
        <p className="mt-3 text-muted-foreground">Carregando informações da unidade…</p>
      </div>
    )
  }

  return (
    <div className="container-max py-10 prose max-w-none">
      <h1>Política de Privacidade – {razaoSocial} (CNPJ: {cnpj})</h1>
      <p><strong>Última atualização:</strong> {hojeISO()}</p>

      <p>A <strong>{nomeFantasia}</strong> valoriza a sua privacidade. Esta Política descreve como coletamos, utilizamos e protegemos dados pessoais, em conformidade com a legislação brasileira aplicável (incluindo a LGPD – Lei nº 13.709/2018).</p>

      <h2>Dados que coletamos</h2>
      <ul>
        <li><strong>Fornecidos por você:</strong> nome, e-mail, telefone, CPF e outros necessários para o atendimento/serviços.</li>
        <li><strong>De navegação:</strong> endereço IP, identificadores de dispositivo, cookies e analytics.</li>
      </ul>

      <h2>Finalidades do tratamento</h2>
      <ul>
        <li>Prestar e aprimorar nossos serviços e funcionalidades do site.</li>
        <li>Atender obrigações legais e regulatórias.</li>
        <li>Comunicar atualizações, informações e ofertas (quando houver consentimento).</li>
        <li>Garantir segurança, prevenção a fraudes e proteção ao titular.</li>
      </ul>

      <h2>Compartilhamento</h2>
      <p>Poderemos compartilhar dados com parceiros de tecnologia, provedores de infraestrutura/hospedagem e autoridades quando exigido por lei. Não vendemos dados pessoais.</p>

      <h2>Seus direitos (LGPD)</h2>
      <ul>
        <li>Confirmação e acesso aos dados;</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários/excessivos;</li>
        <li>Portabilidade, quando aplicável;</li>
        <li>Informações sobre compartilhamento;</li>
        <li>Revogação do consentimento e oposição a tratamentos irregulares.</li>
      </ul>

      <h2>Segurança da informação</h2>
      <p>Adotamos medidas técnicas e organizacionais para proteger os dados contra acessos não autorizados, incidentes e usos indevidos.</p>

      <h2>Retenção</h2>
      <p>Os dados são mantidos pelo tempo necessário ao cumprimento das finalidades e obrigações legais/contratuais.</p>

      <h2>Alterações desta Política</h2>
      <p>Poderemos atualizar este documento para refletir melhorias, mudanças legais ou operacionais. A versão vigente é sempre a publicada neste site com a data de atualização.</p>

      <h2>Encarregado/Contato</h2>
      <p>Para exercer seus direitos ou tirar dúvidas, entre em contato com a <strong>{nomeFantasia}</strong>:</p>
      <ul>
        <li>📞 {telefone}</li>
        <li>✉️ {email}</li>
        <li>📍 {endereco}{cidadeUF ? ` — ${cidadeUF}` : ''}</li>
      </ul>
    </div>
  )
}
