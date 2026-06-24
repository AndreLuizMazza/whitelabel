---
name: whitelabel-progem
description: Umbrella skill for PROGEM whitelabel tenant identity, branding build/runtime, and cross-repo dependencies. Use when onboarding tenants, debugging logo/favicon/theme, or before any whitelabel change touching branding or deploy.
---

# Whitelabel PROGEM — Skill Guarda-Chuva

Índice operacional do `web-progem-white-label` no ecossistema Awis–Progem.

## Documentação formal

| Doc | Conteúdo |
|-----|----------|
| `awis admin/docs/ecossistema-awis-progem.md` | Visão geral 3 projetos |
| `awis admin/docs/TAMS-187-whitelabel-assets.md` | S3, manifest, Console, API |
| `awis admin/docs/TAMS-502-documentacao-implementacao.md` | Member zone UX |

## Skills especializadas (usar conforme tarefa)

| Skill | Quando |
|-------|--------|
| `tenant-resolution-audit` | Slug, PROGEM_TENANT_ID, domínio, OAuth |
| `branding-config-audit` | JSON, theme-inline, parity, favicon/logo |
| `build-deploy-safety-check` | Deploy Vercel, env vars |
| `progem-ux-ui-expert` | Layouts Public/Auth/Member |
| `tams-502-member-zone` | Dashboard `/area`, perfil, auth UX |
| `awis-progem-secure-dev` | Regras de segurança cross-repo |

## Fluxo build → runtime → API

```
TENANT env → config/tenants/<slug>.json
         → scripts/theme-build.mjs → public/theme-inline.js
         → first paint (window.__TENANT__)

PROGEM_TENANT_ID → server/index.js X-Progem-ID
                 → TenantBootstrapper → /unidades/me
                 → brandingSync.js → GET /public/branding (45s poll)
                 → applyBrandingManifest (logos, favicon, hero)
```

## Fontes da verdade

| Dado | Primária |
|------|----------|
| First paint CSS/ícones | `theme-inline.js` (build JSON) |
| Runtime branding | API manifest + S3 (`assetsRevision`) |
| Tenant ID API | `PROGEM_TENANT_ID` |
| Slug UI | JSON slug + bootstrap |

## Regras de ouro

1. **1 deploy = 1 PROGEM_TENANT_ID**
2. **assetsBaseUrl** deve conter `/arquivos/{empresaId}/` correto
3. **Nunca** commitar `theme-inline.js` de outro tenant por engano
4. **Sempre** rodar parity tests antes de deploy
5. Branding pipeline = **TAMS-187**; member UX = **TAMS-502** — não misturar escopos

## Comandos rápidos

```bash
TENANT=<slug> node scripts/theme-build.mjs
TENANT=<slug> npm run test:shell-branding
TENANT=<slug> npm run test:seo-inline-parity
npm run test:contract
npm run build:tenant -- --tenant=<slug>
```

## Projetos relacionados

- **awis-console:** `.cursor/skills/awis-console-tenant-admin`
- **progem-api:** `.cursor/skills/progem-api-whitelabel`
