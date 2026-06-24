/** Política de Privacidade — baseada no modelo anexo, sem referências Rosapax/Infusão. */
export const privacySections = [
  {
    type: 'paragraphs',
    paragraphs: [
      'A {{TENANT_LEGAL_NAME}} (CNPJ {{TENANT_DOCUMENT}}), responsável pelo site {{TENANT_SITE_URL}}, valoriza a privacidade dos titulares de dados. Esta Política descreve como coletamos, usamos, compartilhamos e protegemos dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018), o Marco Civil da Internet e demais normas aplicáveis.',
      'A {{PLATFORM_NAME}} é operada tecnologicamente por {{AWIS_LEGAL_NAME}} (CNPJ {{AWIS_DOCUMENT}}), que pode atuar como operadora de tratamento conforme escopo de cada funcionalidade. Papéis de controlador/operador podem variar conforme o tipo de dado e finalidade — sujeito a validação jurídica específica por tenant.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '1. Dados que coletamos',
  },
  {
    type: 'list',
    items: [
      'Dados fornecidos por você: nome, CPF, e-mail, telefone, endereço, dados de contrato, dependentes e demais informações necessárias ao cadastro e prestação de serviços.',
      'Dados de navegação e dispositivo: endereço IP, identificadores de sessão, logs de acesso, cookies e armazenamento local (ver Política de Cookies).',
      'Dados de pagamento: tratados por instituições de pagamento integradas; não armazenamos dados completos de cartão quando processados por terceiros certificados.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '2. Finalidades e bases legais',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Tratamos dados com base no consentimento, execução de contrato, cumprimento de obrigação legal, exercício regular de direitos e legítimo interesse, conforme art. 7º da LGPD.',
    ],
  },
  {
    type: 'list',
    items: [
      'Cadastro, autenticação e gestão da conta do associado;',
      'Prestação de serviços contratados e suporte;',
      'Comunicações sobre contrato, pagamentos e funcionalidades;',
      'Segurança, prevenção a fraudes e auditoria;',
      'Cumprimento de obrigações legais e regulatórias;',
      'Melhoria da plataforma e experiência do usuário, respeitados consentimentos aplicáveis.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '3. Compartilhamento',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Podemos compartilhar dados com: {{AWIS_LEGAL_NAME}} (operadora da plataforma), provedores de hospedagem, meios de pagamento (ex.: Celcoin/Safe2pay ou equivalentes), serviços de comunicação, autoridades públicas quando exigido por lei, e parceiros estritamente necessários à prestação contratada.',
      'Não vendemos dados pessoais. Qualquer compartilhamento observa medidas contratuais de proteção e minimização.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '4. Prazo de conservação',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Conservamos dados pelo tempo necessário às finalidades descritas, ao cumprimento de obrigações legais/contratuais e ao exercício de direitos. Após esse período, dados podem ser eliminados ou anonimizados conforme política interna e exigências legais.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '5. Segurança',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Adotamos medidas técnicas e organizacionais para proteger dados contra acesso não autorizado, perda, alteração ou divulgação indevida, incluindo controle de acesso, criptografia em trânsito (HTTPS) e segregação por tenant na plataforma.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '6. Direitos do titular (LGPD)',
  },
  {
    type: 'list',
    items: [
      'Confirmação da existência de tratamento e acesso;',
      'Correção de dados incompletos, inexatos ou desatualizados;',
      'Anonimização, bloqueio ou eliminação de dados desnecessários;',
      'Portabilidade, quando aplicável;',
      'Informação sobre compartilhamentos;',
      'Revogação do consentimento e oposição a tratamentos irregulares.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '7. Encarregado / Contato',
  },
  {
    type: 'contact',
    lines: [
      'Controlador/prestador: {{TENANT_LEGAL_NAME}} (CNPJ {{TENANT_DOCUMENT}})',
      'E-mail: {{TENANT_SUPPORT_EMAIL}}',
      'Telefone: {{TENANT_SUPPORT_PHONE}}',
      'Endereço: {{TENANT_ADDRESS}}',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '8. Alterações',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Podemos atualizar esta Política para refletir mudanças legais ou operacionais. A versão vigente será publicada neste site com a data de atualização indicada no topo do documento.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '9. Foro',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Fica eleito o foro de {{TENANT_FORO}}, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir controvérsias oriundas desta Política, salvo disposição legal em contrário. [Sujeito a validação jurídica por tenant.]',
    ],
  },
]
