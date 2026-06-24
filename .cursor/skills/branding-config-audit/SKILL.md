---
name: branding-config-audit
description: Audits whitelabel branding contract parity between config/tenants JSON, theme-inline.js, manifest, and progem-api BrandingManifestDto. Use when changing tenant JSON, uploading branding assets, running theme-build, or investigating favicon/logo/theme regressions.
---

# Branding Config Audit

Valida coerência do contrato de branding entre JSON local, artefatos de build e API (quando disponível).

## Fonte de verdade no código

| Camada | Arquivo | Papel |
|--------|---------|-------|
| Contrato puro | `src/lib/branding/tenantContract.js` | Resolve URLs, ícones, SEO, manifest payload |
| JSON tenant | `config/tenants/<slug>.json` | Input do build |
| Build output | `public/theme-inline.js`, `public/manifest.webmanifest` | First paint + PWA |
| Runtime sync | `src/boot/brandingSync.js` → `TenantBootstrapper.jsx` | Poll 45s + visibility; `applyBrandingManifest` |
| SEO runtime | `src/lib/seo.js`, `src/lib/shellBranding.js` | Meta tags pós-hydration |
| API (admin) | progem-api `BrandingManifestDto`, `TenantBrandingService.BRANDING_SLOTS` | Manifest persistido + S3 |
| API (público) | `GET /api/v1/public/branding` | Sync runtime com ETag/304 |

## Slots de ícone (devem bater frontend ↔ backend)

De `tenantContract.js`:

**BRAND_ICON_FIELD_KEYS:** `favicon`, `faviconSvg`, `appleTouchIcon`, `pwaIcon192`, `pwaIcon512`, `maskableIcon512`, `ogImage`, `pushIcon`, `pushBadge`

**BRAND_LOGO_FIELD_KEYS:** `logo`, `logoLight`, `logoDark`

Backend espelha em `TenantBrandingService.BRANDING_SLOTS` (progem-api).

## Entradas necessárias

- Slug tenant
- `config/tenants/<slug>.json`
- `public/theme-inline.js` (após build)
- Opcional: resposta `GET /api/v1/api-clients/{id}/branding` ou `/public/branding`

## Checklist

```
Branding Config:
- [ ] 1. JSON válido; campos slug, v, assetsBaseUrl, brand presentes
- [ ] 2. vars e varsDark definem --primary e tokens essenciais
- [ ] 3. theme-build.mjs executou sem erro para o slug
- [ ] 4. test:shell-branding PASS
- [ ] 5. test:seo-inline-parity PASS
- [ ] 6. test:contract PASS
- [ ] 7. Favicon resolve (não 404 em fallback /img/logo.png)
- [ ] 8. manifest.webmanifest name/icons coerentes com brand
- [ ] 9. assetsBaseUrl empresaId = PROGEM_TENANT_ID
- [ ] 10. Drift JSON local vs API manifest documentado (se API disponível)
- [ ] 11. Upload console incrementou assetsRevision (se alteração recente)
```

## Passo 1 — Regenerar e testar paridade

```bash
TENANT=<slug> node scripts/theme-build.mjs
TENANT=<slug> npm run test:shell-branding
TENANT=<slug> npm run test:seo-inline-parity
npm run test:contract
```

Scripts e o que provam:

| Script | Prova |
|--------|-------|
| `shell-branding-parity.mjs` | Literais em `theme-inline.js` === `tenantContract` resolvers |
| `seo-inline-parity.mjs` | SEO em `theme-inline.js` === contrato |
| `contract-parity.mjs` | Fixtures `demo.json`, `unilife.json` vs resolvers |
| `index-html-seo-parity.mjs` | HTML buildado vs contrato (pós `build:tenant`) |

## Passo 2 — Inspecionar JSON tenant

Campos críticos em `config/tenants/<slug>.json`:

```json
{
  "slug": "...",
  "v": 1,
  "assetsBaseUrl": "https://whitelabel.progem.com.br/arquivos/{empresaId}/",
  "vars": { "--primary": "...", "--surface": "..." },
  "varsDark": { ... },
  "brand": {
    "logo", "logoDark", "favicon", "faviconSvg",
    "appleTouchIcon", "pwaIcon192", "pwaIcon512", "ogImage"
  },
  "shell": { ... },
  "seo": { ... },
  "pwa": { ... },
  "routing": { "primaryDomain": "..." }
}
```

`normalizeTenantLogoFields()` em `theme-build.mjs` normaliza aliases logo/logoLight.

## Passo 3 — Verificar artefatos de build

```bash
# Slug e revision embutidos
grep -E "slug|assetsRevision|__TENANT__" public/theme-inline.js | head

# Manifest
cat public/manifest.webmanifest | jq '.name, .icons[0].src'
```

Pipeline de boot (`index.html` → `theme-inline.js` → `initTheme.js` → `TenantBootstrapper`):

- `applyTenantShellIconsFromContract()` — único ponto de favicon links
- `applyTenantBrandLogoCssVars()` — `--tenant-logo-*`
- Fallback favicon: `SHELL_FAVICON_FALLBACK_PATH = "/img/logo.png"` — verificar se asset existe

## Passo 4 — Comparar com progem-api (drift check)

Se API acessível:

```bash
curl -s -H "X-Progem-ID: <empresaId>" "<PROGEM_BASE>/api/v1/public/branding" \
  | jq '{slug, v, assetsRevision, assetsBaseUrl, brand, vars: .vars["--primary"]}'
```

Compare com JSON local:

```bash
node -e "
const j=require('./config/tenants/<slug>.json');
console.log(JSON.stringify({slug:j.slug,v:j.v,assetsBaseUrl:j.assetsBaseUrl,brand:j.brand,primary:j.vars?.['--primary']},null,2));
"
```

**Gap possível:** drift JSON local ↔ API se upload no Console sem rebuild JSON. Runtime aplica manifest via `brandingSync.js` (poll 45s) — alterações S3 refletem sem hard refresh quando `assetsRevision` muda.

**Doc:** `awis admin/docs/TAMS-187-whitelabel-assets.md`, `ecossistema-awis-progem.md`

## Passo 5 — Cache busting

- Build: paths relativos resolvidos via `assetsBaseUrl` + query `?v=` quando `v`/`assetsRevision` presente (`src/lib/branding/urls.js`)
- API: `assetsRevision` incrementa em upload S3 canônico (progem-api)
- Runtime: `brandingSync.js` re-fetch quando ETag/`assetsRevision` muda
- Vercel: confirmar headers de cache para `theme-inline.js` se configurados

## Saída esperada

```markdown
# Branding Config Report

**Tenant:** <slug>
**Veredito:** CONSISTENT | DRIFT | BROKEN

## Parity tests
| Test | Result |
|------|--------|
| shell-branding | PASS/FAIL |
| seo-inline | PASS/FAIL |
| contract | PASS/FAIL |

## Contract fields
| Field | JSON | theme-inline | API (if any) | Match |
|-------|------|--------------|--------------|-------|
| slug | | | | |
| --primary | | | | |
| favicon | | | | |

## Gaps / risks
- ...

## Recommended actions
1. ...
```

## Gates de aprovação

| Veredito | Condição |
|----------|----------|
| **CONSISTENT** | Parity tests PASS; slug/assetsBaseUrl alinhados |
| **DRIFT** | Parity PASS mas API manifest difere do JSON — documentar e planejar sync |
| **BROKEN** | Qualquer parity FAIL ou assetsBaseUrl empresaId errado |

**Bloqueio de deploy:** parity FAIL; favicon/logo 404 no tenant; `assetsBaseUrl` apontando para empresaId de outro tenant.
