---
name: build-deploy-safety-check
description: Validates whitelabel build scripts, required env vars, and parity tests before deploy to Vercel. Use before production deploy, when changing package.json scripts, vercel.json, server/index.js env, or when the user mentions build, deploy, Vercel, or PROGEM_TENANT_ID.
---

# Build & Deploy Safety Check

Auditoria obrigatória antes de deploy ou merge que afete build/deploy do `web-progem-white-label`.

## Escopo

- Projeto: `web-progem-white-label`
- Dependências cruzadas: `awis-console` (`TenantTabEnv.tsx` gera `.env`) → Vercel → BFF (`server/index.js`)

## Entradas necessárias

- Slug do tenant (`TENANT`)
- `.env` de produção (ou artefato gerado pelo console)
- Branch/commit a publicar

## Checklist executável

Copie e marque cada item:

```
Build & Deploy Safety:
- [ ] 1. Build usa build:tenant (NÃO npm run build)
- [ ] 2. TENANT definido e config/tenants/<slug>.json existe
- [ ] 3. theme-inline.js regenerado (public/theme-inline.js)
- [ ] 4. manifest.webmanifest regenerado
- [ ] 5. PROGEM_TENANT_ID preenchido e numérico
- [ ] 6. OAUTH_CLIENT_ID + OAUTH_CLIENT_SECRET preenchidos
- [ ] 7. PROGEM_BASE aponta para ambiente correto (prod vs sandbox)
- [ ] 8. FRONTEND_URL = domínio real do tenant (dominioVercel preferencial)
- [ ] 9. CORS_ORIGINS inclui FRONTEND_URL
- [ ] 10. Parity tests passam para o tenant
- [ ] 11. Nenhum secret em bundle Vite (só vars VITE_* públicas)
- [ ] 12. Rollback path documentado (commit/tag Vercel anterior)
```

## Passo 1 — Validar script de build

**Evidência:** `package.json`

| Script | Seguro para whitelabel? |
|--------|-------------------------|
| `npm run build` | **NÃO** — só `vite build`, pula `theme-build.mjs` |
| `npm run build:tenant` | **SIM** — `prebuild:tenant` + `vite build` |
| `npm run dev` | OK local — roda `predev` → `theme-build.mjs` |

Comando correto:

```bash
TENANT=<slug> npm run build:tenant
```

`theme-build.mjs` exige `TENANT`; sem ele o build falha (exit 1).

## Passo 2 — Validar artefatos gerados

Arquivos que **devem** mudar após `build:tenant`:

- `public/theme-inline.js` — define `window.__TENANT__`, CSS vars, favicon links
- `public/manifest.webmanifest` — PWA manifest por tenant

Verificar slug embutido:

```bash
grep -o '__TENANT__.*slug' public/theme-inline.js
```

## Passo 3 — Validar variáveis BFF (server/index.js)

**Obrigatórias em produção** (comentário linhas 14–26 de `server/index.js`):

| Variável | Função | Bloqueio se ausente |
|----------|--------|---------------------|
| `PROGEM_TENANT_ID` | Header `X-Progem-ID` fixo por deployment | API calls sem tenant |
| `OAUTH_CLIENT_ID` | OAuth client_credentials | BFF não obtém token |
| `OAUTH_CLIENT_SECRET` | OAuth client_credentials | BFF não obtém token |
| `PROGEM_BASE` | URL upstream Progem | Proxy quebrado |
| `FRONTEND_URL` | CORS / redirects | CORS fail |
| `NODE_ENV=production` | Comportamento prod | Dev endpoints expostos |

**Recomendadas:** `CORS_ORIGINS`, `OAUTH_SCOPE`, `VENDEDOR_EMAIL_PADRAO`, `NALAPIDE_API_BASE`, `NALAPIDE_API_KEY`, `TRUST_PROXY=1` (Vercel)

**Constraint crítico:** 1 deployment Vercel = 1 `PROGEM_TENANT_ID`. Não existe roteamento multi-tenant no BFF (`injectHeaders()` em `server/index.js`).

## Passo 4 — Rodar parity tests

Substitua `<slug>` pelo tenant alvo:

```bash
TENANT=<slug> node scripts/theme-build.mjs
TENANT=<slug> npm run test:shell-branding
TENANT=<slug> npm run test:seo-inline-parity
npm run test:contract
TENANT=<slug> npm run build:tenant && TENANT=<slug> npm run test:index-html-seo
```

Qualquer falha = **bloqueio de deploy**.

## Passo 5 — Validar alinhamento console → Vercel

Se o tenant foi configurado via `awis-console`:

1. Abrir tab **Variáveis de Ambiente** (`TenantTabEnv.tsx`)
2. Confirmar `.env` gerado contém `TENANT`, `PROGEM_TENANT_ID`, `OAUTH_*`, `FRONTEND_URL`
3. Confirmar `OAUTH_CLIENT_ID` = `clientId` do tenant no console
4. Confirmar `PROGEM_TENANT_ID` = `empresaId` do tenant

**Gap conhecido:** ENV do console é download manual — não persiste no backend. Deploy incompleto = risco alto.

## Passo 6 — Secrets no frontend

Variáveis `VITE_*` vão para o bundle. **Nunca** colocar:

- `OAUTH_CLIENT_SECRET`
- `NALAPIDE_API_KEY`
- `PROGEM_WEBHOOK_SECRET`

Esses ficam só no BFF/serverless.

## Saída esperada

```markdown
# Build & Deploy Safety Report

**Tenant:** <slug>
**Ambiente:** production | sandbox
**Veredito:** PASS | BLOCK

## Checks
| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 1 | build:tenant | ✅/❌ | ... |

## Bloqueios (se BLOCK)
- ...

## Rollback
- Vercel deployment anterior: <url ou id>
- Secret rotation: <sim/não>
```

## Gates de aprovação

| Resultado | Condição |
|-----------|----------|
| **PASS** | Todos itens 1–11 OK; parity green |
| **BLOCK** | Qualquer item crítico falhou |

Itens **sempre bloqueantes:** 1, 2, 5, 6, 7, 10.
