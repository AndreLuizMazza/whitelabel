---
name: tenant-resolution-audit
description: Audits tenant identity alignment across build slug, PROGEM_TENANT_ID, OAuth clientId, domain, and runtime slug resolution in the PROGEM whitelabel stack. Use when onboarding a tenant, changing domains, editing TenantBootstrapper, server/index.js injectHeaders, or config/tenants JSON.
---

# Tenant Resolution Audit

Garante que a identidade do tenant é consistente entre build, deploy, runtime e API.

## Projetos envolvidos

| Projeto | Arquivos-chave |
|---------|----------------|
| whitelabel | `config/tenants/<slug>.json`, `scripts/theme-build.mjs`, `server/index.js`, `src/components/TenantBootstrapper.jsx`, `src/boot/tenant.js` |
| progem-api | `ApiClient.java`, `PublicBrandingController.java`, `ApiClientRepository.java` |
| awis-console | `ApiClientsPage.tsx`, `TenantTabEnv.tsx` |

## Entradas necessárias

- Slug (`TENANT` / `clientId`)
- `PROGEM_TENANT_ID` (`.env` ou Vercel)
- `OAUTH_CLIENT_ID`
- `dominio` / `dominioVercel` (console ou API)
- Opcional: resposta `GET /api/v1/api-clients/{id}/detail`

## As 3 camadas de identidade (evidência real)

```
Camada A — BUILD          TENANT env → config/tenants/<slug>.json → window.__TENANT__.slug
Camada B — DEPLOY/API     PROGEM_TENANT_ID → X-Progem-ID (= empresaId) em TODAS as calls BFF→Progem
Camada C — RUNTIME UI     TenantBootstrapper: API slug → __TENANT__ → localStorage → subdomain heuristic
```

**Camadas A e B podem divergir.** Ex.: build com `TENANT=provida` mas `PROGEM_TENANT_ID=128` de outro tenant = falha silenciosa.

**Constraint:** 1 deployment = 1 `PROGEM_TENANT_ID` (`server/index.js` linha 167).

## Checklist

```
Tenant Resolution:
- [ ] 1. config/tenants/<slug>.json existe e slug JSON = TENANT env
- [ ] 2. PROGEM_TENANT_ID = empresaId do ApiClient no progem-api
- [ ] 3. OAUTH_CLIENT_ID = clientId do ApiClient
- [ ] 4. assetsBaseUrl no JSON contém empresaId correto (/arquivos/{id}/)
- [ ] 5. dominio/dominioVercel no console bate com FRONTEND_URL
- [ ] 6. window.__TENANT__.slug (theme-inline.js) = slug esperado
- [ ] 7. Subdomain heuristic não conflita (se hostname tem 3+ partes)
- [ ] 8. NaLápide: dataset.tenantSlug / x-tenant-slug coerente (memorial)
- [ ] 9. GET /api/v1/unidades/me retorna empresa do tenant correto
- [ ] 10. Sem referência a default.json ausente (fallback quebrado)
```

## Passo 1 — Validar JSON local

```bash
# slug no JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('config/tenants/<slug>.json')).slug)"

# empresaId implícito no assetsBaseUrl
grep assetsBaseUrl config/tenants/<slug>.json
```

Padrão CDN: `https://whitelabel.progem.com.br/arquivos/{empresaId}/`

## Passo 2 — Validar .env / Vercel

Cross-check (valores do console ou API):

| Campo console | Variável whitelabel | Deve ser igual |
|---------------|---------------------|----------------|
| `clientId` | `OAUTH_CLIENT_ID` / `TENANT` | slug |
| `empresaId` | `PROGEM_TENANT_ID` | número |
| `dominioVercel` ou `dominio` | `FRONTEND_URL` | URL base |

**Alerta comum:** `.env` com `OAUTH_CLIENT_ID=saobento` mas sem `config/tenants/saobento.json` → build quebra ou usa tenant errado.

## Passo 3 — Validar runtime slug

Ordem em `TenantBootstrapper.jsx` `pickTenantSlugFromAny()`:

1. Resposta bootstrap/API (`result.slug`, `empresa.slug`)
2. `window.__TENANT__.slug` (build)
3. `localStorage` (`TENANT_SLUG`, `tenantSlug`, `tenant`)
4. Primeiro label do hostname se `parts.length >= 3` (exceto `www`)

**Risco:** subdomain heuristic pode sobrescrever slug incorreto em staging (`tenant.vercel.app`).

## Passo 4 — Validar API (se acessível)

```bash
# Branding público — resolve por X-Progem-ID ou Host
curl -s -H "X-Progem-ID: <empresaId>" "<PROGEM_BASE>/api/v1/public/branding" | jq '.slug, .assetsBaseUrl'

# Empresa autenticada (precisa token)
curl -s -H "Authorization: Bearer <token>" -H "X-Progem-ID: <empresaId>" \
  "<PROGEM_BASE>/api/v1/unidades/me" | jq '.nomeFantasia, .id'
```

No progem-api, `TenantBrandingService.resolvePublicBranding` resolve por:
1. `empresaId` (header)
2. `Host` / `X-Forwarded-Host` → `dominio` ou `dominioVercel`

**Runtime branding:** whitelabel consome `GET /api/v1/public/branding` via `src/boot/brandingSync.js` (poll 45s, `BRANDING_POLL_MS`). Iniciado em `TenantBootstrapper.jsx`. Logo hero member reage via `tenantLogoRuntime.js`.

**Doc:** `awis admin/docs/ecossistema-awis-progem.md`

## Passo 5 — NaLápide (tenant separado)

Memorial usa `x-tenant-slug` via `src/lib/nalapide.js` e `server/nalapide-proxy.js` — **não** usa `X-Progem-ID`.

Confirmar mapeamento slug Progem ↔ slug NaLápide no console (`TenantTabNalapide.tsx`).

## Saída esperada

```markdown
# Tenant Resolution Report

**Tenant:** <slug>
**Veredito:** ALIGNED | MISALIGNED

| Camada | Valor encontrado | Valor esperado | Status |
|--------|------------------|----------------|--------|
| Build slug | ... | ... | ✅/❌ |
| PROGEM_TENANT_ID | ... | ... | ✅/❌ |
| OAuth clientId | ... | ... | ✅/❌ |
| assetsBaseUrl empresaId | ... | ... | ✅/❌ |
| FRONTEND_URL | ... | ... | ✅/❌ |

## Mismatches
- ...

## Risco em produção
- ...
```

## Gates de aprovação

| Veredito | Condição |
|----------|----------|
| **ALIGNED** | Itens 1–6 e 9 OK |
| **MISALIGNED** | Qualquer mismatch entre slug, empresaId ou clientId |

**Bloqueio automático:** PROGEM_TENANT_ID ≠ empresaId do clientId ativo; JSON de tenant ausente para slug do build.
