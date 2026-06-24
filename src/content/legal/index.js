import { cookiesSections } from '@/content/legal/cookies.sections'
import { privacySections } from '@/content/legal/privacy.sections'
import { termsSections } from '@/content/legal/terms.sections'
import {
  getLegalDocumentMeta,
  LEGAL_DOCUMENTS,
  AWIS_LEGAL_NAME,
  AWIS_DOCUMENT,
  PLATFORM_NAME,
} from '@/content/legal/legalMeta'

const SECTIONS_BY_ID = {
  terms: termsSections,
  privacy: privacySections,
  cookies: cookiesSections,
}

export function getLegalSections(docId) {
  return SECTIONS_BY_ID[docId] || []
}

export function resolveLegalDocument(docId) {
  const meta = getLegalDocumentMeta(docId)
  if (!meta) return null
  return {
    meta,
    sections: getLegalSections(docId),
  }
}

export {
  cookiesSections,
  privacySections,
  termsSections,
  getLegalDocumentMeta,
  LEGAL_DOCUMENTS,
  AWIS_LEGAL_NAME,
  AWIS_DOCUMENT,
  PLATFORM_NAME,
}

export { buildLegalContext } from '@/content/legal/buildLegalContext'
export { interpolate, interpolateSection, sanitizeLegalValue } from '@/content/legal/interpolate'
