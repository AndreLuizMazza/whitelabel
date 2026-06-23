/**
 * Lógica de sync: nunca downgrade de revision; aplica bump remoto.
 */
function shouldApplyBrandingSync({ force = false, remoteRev, localRev, remoteUpdatedMs, lastAppliedMs }) {
  if (force) return true
  if (remoteRev === 0 && localRev > 0) {
    return remoteUpdatedMs > lastAppliedMs
  }
  if (remoteRev > 0 && remoteRev < localRev) {
    return remoteUpdatedMs > lastAppliedMs
  }
  if (remoteRev > 0 && remoteRev === localRev) {
    return remoteUpdatedMs > lastAppliedMs
  }
  return true
}

function resolveManifestRevisionForApply({ manifest, localRev, remoteUpdatedMs, lastAppliedMs }) {
  const remoteRev = Number(manifest.assetsRevision ?? manifest.v ?? 0)
  if (remoteRev > 0 && remoteRev < localRev && remoteUpdatedMs > lastAppliedMs) {
    return { ...manifest, assetsRevision: localRev + 1, v: localRev + 1 }
  }
  return manifest
}

function mergeAssetsRevision(localRev, remoteRev) {
  return Math.max(localRev || 0, remoteRev || 0)
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(
  !shouldApplyBrandingSync({ remoteRev: 1, localRev: 7, remoteUpdatedMs: 0, lastAppliedMs: 0 }),
  'API atrás do build sem updatedAt novo não aplica'
)
assert(
  shouldApplyBrandingSync({ remoteRev: 1, localRev: 7, remoteUpdatedMs: 200, lastAppliedMs: 100 }),
  'upload recente com API atrás do build deve aplicar'
)
assert(
  shouldApplyBrandingSync({ remoteRev: 8, localRev: 7, remoteUpdatedMs: 0, lastAppliedMs: 0 }),
  'API com revision maior deve aplicar'
)
assert(
  !shouldApplyBrandingSync({ remoteRev: 7, localRev: 7, remoteUpdatedMs: 100, lastAppliedMs: 100 }),
  'mesma revision e mesmo updatedAt não reaplica'
)
assert(
  shouldApplyBrandingSync({ remoteRev: 7, localRev: 7, remoteUpdatedMs: 200, lastAppliedMs: 100 }),
  'mesma revision mas updatedAt novo reaplica (overwrite S3)'
)
assert(mergeAssetsRevision(7, 1) === 7, 'merge nunca downgrade')
assert(mergeAssetsRevision(7, 9) === 9, 'merge aceita bump remoto')

const bumped = resolveManifestRevisionForApply({
  manifest: { assetsRevision: 2, updatedAt: '2026-05-21T12:00:00Z' },
  localRev: 7,
  remoteUpdatedMs: 200,
  lastAppliedMs: 100,
})
assert(bumped.assetsRevision === 8, 'bump local quando API desalinhada')

function mergeAboutSection(about0, about1) {
  if (!about1 || typeof about1 !== 'object') {
    return about0 && typeof about0 === 'object' ? about0 : {}
  }
  const base0 = about0 && typeof about0 === 'object' ? about0 : {}
  const merged = { ...base0, ...about1 }
  const g0 = Array.isArray(base0.gallery) ? base0.gallery : []
  const g1 = Array.isArray(about1.gallery) ? about1.gallery : []
  if (g1.length === 0 && g0.length > 0) merged.gallery = g0
  else if (g1.length > 0) merged.gallery = g1
  const seo0 = base0.seo && typeof base0.seo === 'object' ? base0.seo : {}
  const seo1 = about1.seo && typeof about1.seo === 'object' ? about1.seo : {}
  if (Object.keys(seo0).length || Object.keys(seo1).length) merged.seo = { ...seo0, ...seo1 }
  return merged
}

const mergedAbout = mergeAboutSection(
  {
    photo: 'sobre/sobre-nos.jpg',
    gallery: [{ image: 'sobre/sobre-nos2.jpg', caption: 'A' }],
  },
  { photo: 'sobre/sobre-nos.jpg', gallery: [] }
)
assert(mergedAbout.gallery.length === 1, 'gallery vazia da API não apaga galeria do build')
assert(mergedAbout.gallery[0].image === 'sobre/sobre-nos2.jpg', 'preserva paths da galeria local')

console.log('[ok] branding sync logic tests passed')
