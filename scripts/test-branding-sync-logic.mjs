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

console.log('[ok] branding sync logic tests passed')
