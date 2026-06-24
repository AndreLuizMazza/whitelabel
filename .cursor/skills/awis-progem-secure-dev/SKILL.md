---
name: awis-progem-secure-dev
description: Secure development rules for the Awis-Progem ecosystem across progem-api, awis-console, and web-progem-white-label. Use before any cross-repo change, production deploy, tenant/branding edit, or when unsure about impact scope.
---

# Desenvolvimento Seguro Awis–Progem

Regras obrigatórias para agentes e desenvolvedores.

**Doc central:** `awis admin/docs/ecossistema-awis-progem.md`

## Antes de alterar

1. **Auditar** — ler código/docs; não presumir arquitetura
2. **Mapear impacto** — API + Console + Whitelabel afetados?
3. **Identificar ticket** — TAMS-502 (UX) vs TAMS-187 (branding/S3) — não misturar
4. **Ambiente** — sandbox primeiro; produção só com autorização explícita

## Durante implementação

| Regra | Detalhe |
|-------|---------|
| Contrato público | Nunca alterar DTO/endpoint sem documentar |
| Tenant existente | Nunca quebrar cliente em produção |
| Secrets | Nunca commitar `.env`, AWS keys, OAuth secrets |
| Artefatos build | Não commitar `theme-inline.js` de tenant errado |
| Escopo mínimo | Sem refatoração oportunista |
| Git | Não reescrever histórico; não force-push main |

## Validação obrigatória

```
Whitelabel:
  npm run build (ou build:tenant)
  TENANT=x npm run test:shell-branding
  TENANT=x npm run test:seo-inline-parity

Console:
  npm run build
  npm test (se disponível)

API:
  mvn test (classes relevantes)
```

Registrar falhas — não deployar com build quebrado.

## Rollback

- Vercel: redeploy commit/tag anterior
- API: revert commit + redeploy container
- S3: assets versionados preservam histórico; canônicos sobrescrevem — ter backup

## Skills por repo (este workspace: whitelabel)

| Skill | Uso |
|-------|-----|
| `whitelabel-progem` | Visão geral |
| `branding-config-audit` | Branding |
| `tenant-resolution-audit` | Identidade tenant |
| `build-deploy-safety-check` | Deploy |
| `tams-502-member-zone` | UX member |
| `awis-console-tenant-admin` | Console (repo awis-console) |
| `progem-api-whitelabel` | API (repo progem-api) |

## Checklists

Ver seções 5–7 em `ecossistema-awis-progem.md`:
- Validação whitelabel
- Segurança alteração tenant
- Pré-deploy

## Quando parar e pedir autorização

- Alteração em produção ou dados reais de clientes
- Migração de banco destrutiva
- Mudança de contrato OAuth/domínio em tenant live
- Exposição de segredos em log ou commit
