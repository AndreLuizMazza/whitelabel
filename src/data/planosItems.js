// Itens do Mega Menu "Planos" (data-driven)
// Cada item pode ter um predicate(empresa) para controle por tenant
export const planosItems = [
  {
    id: 'individual',
    to: '/planos#individual',
    icon: 'ShieldCheck',
    title: 'Plano Individual',
    desc: 'Cobertura completa para uma pessoa, com carências e benefícios.',
  },
  {
    id: 'familiar',
    to: '/planos#familiar',
    icon: 'Users',
    title: 'Plano Familiar',
    desc: 'Até 7 pessoas no mesmo endereço, com extras opcionais.',
  },
  {
    id: 'empresarial',
    to: '/planos#empresarial',
    icon: 'HeartHandshake',
    title: 'Plano Empresarial',
    desc: 'Para empresas: cobertura coletiva e gestão facilitada.',
  },
  {
    id: 'telemedicina',
    to: '/beneficios#telemedicina',
    icon: 'Sparkles',
    title: 'Telemedicina',
    desc: 'Incluso para titular e opcional aos dependentes.',
    // Exemplo de controle por feature:
    // predicate: (empresa) => !!empresa?.telemedicina
  },
  {
    id: 'clube',
    to: '/beneficios#clube',
    icon: 'BadgeDollarSign',
    title: 'Clube de Descontos',
    desc: 'Rede de parceiros com vantagens exclusivas.',
  },
  {
    id: 'comparador',
    to: '/planos#comparador',
    icon: 'ShieldCheck',
    title: 'Comparador',
    desc: 'Compare coberturas, carências e valores rapidamente.',
  },
]

export const planosCta = {
  to: '/planos#simulacao',
  label: 'Simular agora',
  help: 'Precisa de ajuda para escolher? Veja nosso guia de planos.',
}
