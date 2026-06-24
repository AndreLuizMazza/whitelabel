# AGENTS — web-progem-white-label

Guia para agentes de IA no whitelabel PROGEM.

## Documentação

| Documento | Path |
|-----------|------|
| Ecossistema | `../../awis admin/docs/ecossistema-awis-progem.md` |
| TAMS-502 (member UX) | `../../awis admin/docs/TAMS-502-documentacao-implementacao.md` |
| TAMS-187 (branding/S3) | `../../awis admin/docs/TAMS-187-whitelabel-assets.md` |

## Skills Cursor (`.cursor/skills/`)

| Skill | Quando usar |
|-------|-------------|
| `whitelabel-progem` | Visão geral tenant/branding |
| `branding-config-audit` | JSON, theme-inline, parity |
| `tenant-resolution-audit` | Slug, PROGEM_TENANT_ID |
| `build-deploy-safety-check` | Deploy Vercel |
| `progem-ux-ui-expert` | Layouts UX |
| `tams-502-member-zone` | `/area`, perfil, auth |
| `awis-progem-secure-dev` | Regras de segurança |

## Regras rápidas

1. TAMS-502 = UX member; TAMS-187 = branding pipeline
2. Sempre rodar parity tests antes de deploy tenant
3. Não commitar secrets ou `theme-inline.js` de tenant errado
4. Mapear impacto API + Console antes de mudar contrato branding

## Build

```bash
TENANT=<slug> npm run build:tenant
TENANT=<slug> npm run test:shell-branding
```
