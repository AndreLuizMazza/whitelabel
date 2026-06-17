# Whitelabel UX Patterns — web-progem-white-label

Regras específicas deste repositório.

## Matriz rota → layout → zona

| Rota | Layout | Zona |
|------|--------|------|
| `/`, `/planos`, `/planos/:id` | PublicLayout | public |
| `/produtos`, `/produtos/:id` | PublicLayout | public |
| `/beneficios`, `/beneficios/:id` | PublicLayout | public |
| `/memorial`, `/memorial/:slug` | PublicLayout | public |
| `/contratos`, `/contratos/:id/pagamentos` | PublicLayout | public |
| `/filiais`, `/sobre-nos`, `/verificar/:cpf` | PublicLayout | public |
| `/politica-*`, `/termos-uso` | PublicLayout | public |
| `/login`, `/criar-conta` | AuthLayout | auth |
| `/recuperar-senha`, `/redefinir-senha`, `/trocar-senha` | AuthLayout | auth |
| `/area`, `/area/dependentes`, `/area/pagamentos` | MemberLayout | member |
| `/perfil`, `/carteirinha`, `/servicos-digitais` | MemberLayout | member |
| `/cadastro`, `/confirmacao` | PublicLayout + PrivateRoute | member flow in public chrome |
| `/carteirinha/print` | none (minimal) | print |

## Arquivos de layout

```
src/layouts/
├── PublicLayout.jsx   # GlobalShell + Navbar + Footer + Dock rules
├── AuthLayout.jsx     # Logo + Outlet, no marketing nav
├── MemberLayout.jsx   # PrivateRoute wrapper + AppShell
├── AppShell.jsx       # Member sidebar + mobile header + bottom tab
└── GlobalShell.jsx    # Marketing sidebar (public only)
```

## Design tokens (não alterar sem branding audit)

- CSS vars: `src/styles/theme.css` (`--primary`, `--surface`, `--text`, `--c-border`)
- Tenant overrides: `public/theme-inline.js` via `scripts/theme-build.mjs`
- Utilities: `src/index.css` (`.btn`, `.btn-primary`, `.card`, `.input`, `.container-max`, `.section`)
- Dark: `class="dark"` on `html` + `varsDark` from tenant JSON

## Componentes UI

| Componente | Path | Uso |
|------------|------|-----|
| Button | `src/components/ui/Button.jsx` | Auth + Member (variants: primary, outline, ghost) |
| CTAButton | `src/components/ui/CTAButton.jsx` | Marketing pages only |
| Skeleton | `src/components/ui/Skeleton.jsx` | Shared loading states |
| PrivateRoute | `src/components/PrivateRoute.jsx` | Preserves `state.from` |

## Menu privado (AppShell + GlobalShell PRIVATE_MENU_LINKS)

1. `/area` — Área do Associado
2. `/area/dependentes` — Dependentes
3. `/area/pagamentos` — Pagamentos
4. `/carteirinha` — Carteirinha
5. `/perfil` — Meu Perfil

Bottom tab mobile: mesmos 5 destinos, labels curtos.

## Capacitor embed

- `document.documentElement.dataset.embedded = 'capacitor'`
- Navbar may hide `beneficios` / `segunda-via` — preserve checks when editing nav

## Elder mode

- Toggle in Navbar → `html[data-elder-mode=on]`
- Scales fonts and min touch targets in `index.css`
- Test member + auth screens with elder mode on

## Footer / Dock rules (PublicLayout)

Hide Footer on: `/planos/:id`, `/produtos/:id`, `/cadastro`, `/confirmacao`

Hide ContactDock on: `/cadastro`, `/confirmacao`, `/criar-conta`, `/memorial`, `/produtos`, `/produtos/*`

Member and Auth layouts: never render Footer or Dock.

## Auth flow invariants

- `POST /api/v1/app/auth/login` via BFF
- `localStorage.login_ident` for remember identifier
- Redirect: `location.state?.from?.pathname || '/area'`
- FCM registration post-login (non-blocking)

## Branding regression

After visual changes, run:
```bash
TENANT=<slug> npm run test:shell-branding
TENANT=<slug> npm run test:seo-inline-parity
```
