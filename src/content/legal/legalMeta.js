/** Constantes AWIS/PROGEM — revisão jurídica antes de alterar. */
export const AWIS_LEGAL_NAME = 'AWIS DESENVOLVIMENTO DE SOFTWARE LTDA'
export const AWIS_DOCUMENT = '45.839.937/0001-93'
export const PLATFORM_NAME = 'Plataforma Progem'

export const LEGAL_DOCUMENTS = {
  terms: {
    id: 'terms',
    title: 'Termos de Uso',
    version: '2025-09-26',
    updatedAtLabel: '26/09/2025',
    publicPath: '/termos-uso',
    memberPath: '/area/legal/termos',
  },
  privacy: {
    id: 'privacy',
    title: 'Política de Privacidade',
    version: '2026-06-01',
    updatedAtLabel: 'Junho de 2026',
    publicPath: '/politica-privacidade',
    memberPath: '/area/legal/privacidade',
  },
  cookies: {
    id: 'cookies',
    title: 'Política de Cookies',
    version: '2026-06-01',
    updatedAtLabel: 'Junho de 2026',
    publicPath: '/politica-cookies',
    memberPath: '/area/legal/cookies',
  },
}

export function getLegalDocumentMeta(docId) {
  return LEGAL_DOCUMENTS[docId] || null
}
