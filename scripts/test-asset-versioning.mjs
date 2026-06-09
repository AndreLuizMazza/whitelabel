/**
 * Smoke tests for generic upload versioning (tab Arquivos S3, fora do contrato).
 */
function versionedFilename(sanitizedOriginal, hash8) {
  const dot = sanitizedOriginal.lastIndexOf('.')
  if (dot > 0) {
    return sanitizedOriginal.substring(0, dot) + '-' + hash8 + sanitizedOriginal.substring(dot)
  }
  return sanitizedOriginal + '-' + hash8
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const cases = [
  ['gallery.png', 'a3f8c2d1', 'gallery-a3f8c2d1.png'],
  ['hero-banner.webp', '9b2e1f04', 'hero-banner-9b2e1f04.webp'],
]

for (const [input, hash, expected] of cases) {
  const out = versionedFilename(input, hash)
  assert(out === expected, `expected ${expected}, got ${out}`)
}

console.log('[ok] generic upload versioning smoke tests passed')
