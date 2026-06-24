/** Política de Cookies — baseada no modelo anexo, adaptada ao whitelabel PROGEM. */
export const cookiesSections = [
  {
    type: 'paragraphs',
    paragraphs: [
      'Este documento esclarece como {{TENANT_LEGAL_NAME}} (CNPJ {{TENANT_DOCUMENT}}), por meio do site {{TENANT_SITE_URL}}, trata dados armazenados localmente no seu navegador por meio de cookies e tecnologias equivalentes (como localStorage).',
      'Nossa Política de Cookies foi elaborada em conformidade com a Lei nº 12.965/2014 (Marco Civil da Internet), a Lei nº 13.709/2018 (LGPD) e, quando aplicável, o Regulamento Geral de Proteção de Dados (RGPD).',
      'Leia este documento em conjunto com a Política de Privacidade e os Termos de Uso. A plataforma tecnológica é operada por {{AWIS_LEGAL_NAME}} (CNPJ {{AWIS_DOCUMENT}}), titular da {{PLATFORM_NAME}}.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '1. O que são cookies e armazenamento local',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Cookies são pequenos arquivos de texto enviados ao seu navegador. No whitelabel PROGEM também utilizamos localStorage para preferências, sessão e identificação do tenant — com finalidades semelhantes às de cookies persistentes.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '2. Categorias utilizadas',
  },
  {
    type: 'list',
    items: [
      'Necessários: indispensáveis ao funcionamento seguro do site e da área logada.',
      'Funcionais: lembram preferências de interface, tema e identificação do tenant.',
      'Analíticos: atualmente não utilizamos cookies analíticos de terceiros neste site.',
      'Publicidade: atualmente não utilizamos cookies de publicidade neste site.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '3. Tecnologias utilizadas neste site',
  },
  {
    type: 'table',
    headers: ['Nome', 'Categoria', 'Finalidade', 'Expiração'],
    rows: [
      ['progem_cookie_consent', 'Necessário', 'Registra sua escolha sobre cookies opcionais', 'Persistente até exclusão'],
      ['auth-store', 'Necessário', 'Mantém sessão autenticada na área do associado', 'Persistente até logout'],
      ['x_device_id', 'Necessário', 'Identificador do dispositivo para segurança da sessão', 'Persistente até exclusão'],
      ['TENANT_SLUG', 'Funcional', 'Identifica o tenant whitelabel acessado', 'Persistente até exclusão'],
      ['ui_theme', 'Funcional', 'Preferência de tema claro/escuro', 'Persistente até exclusão'],
      ['elder_mode', 'Funcional', 'Modo de acessibilidade com fontes ampliadas', 'Persistente até exclusão'],
      ['login_ident', 'Funcional', 'Lembrar identificador de login (quando autorizado)', 'Persistente até exclusão'],
      ['tenant_theme_snapshot', 'Funcional', 'Cache local de tema/branding do tenant', 'Persistente até exclusão'],
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '4. Como gerenciar',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Você pode gerenciar cookies nas configurações do navegador. Cookies necessários não podem ser desativados sem impactar login, segurança e funcionamento básico.',
      'Para revisar preferências de cookies opcionais neste site, utilize o banner de cookies ou a opção "Preferências de cookies" no Perfil, quando disponível.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '5. Compartilhamento',
  },
  {
    type: 'paragraphs',
    paragraphs: [
      'Dados de cookies/localStorage podem ser processados por provedores de infraestrutura (hospedagem, CDN, notificações) estritamente para operação do serviço, observadas medidas de segurança e contratos aplicáveis.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '6. Seus direitos',
  },
  {
    type: 'list',
    items: [
      'Confirmação e acesso aos dados tratados;',
      'Correção de dados incompletos ou desatualizados;',
      'Eliminação ou anonimização, quando aplicável;',
      'Revogação do consentimento para cookies opcionais;',
      'Informação sobre compartilhamentos e finalidades.',
    ],
  },
  {
    type: 'heading',
    level: 2,
    title: '7. Contato',
  },
  {
    type: 'contact',
    lines: [
      'Prestador: {{TENANT_LEGAL_NAME}} (CNPJ {{TENANT_DOCUMENT}})',
      'E-mail: {{TENANT_SUPPORT_EMAIL}}',
      'Telefone: {{TENANT_SUPPORT_PHONE}}',
      'Endereço: {{TENANT_ADDRESS}}',
    ],
  },
]
