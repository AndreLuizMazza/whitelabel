---
name: tams-502-member-zone
description: Documents TAMS-502 member zone UX scope in web-progem-white-label. Use when changing /area dashboard, AppShell, auth flows, perfil, carteirinha, dependentes, or post-login navigation. Do NOT use for S3/branding pipeline (TAMS-187).
---

# TAMS-502 — Member Zone UX

**Escopo estrito:** UX da área do associado em `web-progem-white-label` apenas.

**Doc:** `awis admin/docs/TAMS-502-documentacao-implementacao.md`

## O que TAMS-502 entregou

- Layouts **Public**, **Auth**, **Member** + `AppShell` (bottom tab mobile)
- Dashboard `/area` (hero enxuto, pagamento PROGEM, grid 2×2, care banner)
- Auth/onboarding: login Stripe-like, cadastro step-first, pós-auth por contrato
- Páginas: carteirinha Wallet, dependentes grouped, perfil, histórico, senha dedicada
- Tema light/dark em home pública + perfil
- Logout mobile em `/perfil`
- Fixes: toast contratos, redirect planos

## Arquivos que agentes tocam com frequência

| Área | Arquivos |
|------|----------|
| Dashboard | `src/pages/AreaUsuario.jsx`, `src/components/member/MemberDashboardUI.jsx` |
| Shell | `src/layouts/AppShell.jsx`, `MemberLayout.jsx`, `App.jsx` |
| Auth | `src/lib/postAuthNavigation.js`, `LoginPage.jsx`, `RegisterPage.jsx`, `Cadastro.jsx` |
| Contratos | `src/hooks/useContratoDoUsuario.js` |
| Perfil | `src/pages/Perfil.jsx`, `PerfilAlterarSenha.jsx` |
| Logo hero | `src/lib/tenantLogoRuntime.js`, `src/hooks/useUserAvatar.js` |

## Decisões UX vigentes (não reverter sem alinhamento)

- Hero: **1 badge** contrato; benefícios no **grid**, não no hero
- Pagamento: card **horizontal** + scroll `#pagamento` (não expand inline Apple-only)
- Atendimento: só **MemberCareBanner** (sem card no grid)
- Grid 2×2: Carteirinha, Dependentes, Pagamentos, Benefícios

## Pendências conhecidas

- Logo placeholder "Sua Marca Aqui" — depende TAMS-187 assets
- Tab bar FAB central — decisão PROGEM (não mockup Apple puro)

## O que NÃO é TAMS-502

| Fora do escopo | Ver |
|----------------|-----|
| S3 upload, manifest API | TAMS-187, `progem-api-whitelabel` |
| Console tabs Identidade/Arquivos | `awis-console-tenant-admin` |
| theme-build, tenant JSON | `branding-config-audit`, `whitelabel-progem` |

## Como testar

```bash
npm run dev
# Manual: /login → /area → grid → /perfil logout (mobile)
npm run build
```

## Branch / commits

- Branch: `feature/TAMS-502`
- ~25 commits desde `main` (`de1795e`)
- HEAD audit: `7a7bff8`
