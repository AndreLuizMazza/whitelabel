---
name: progem-ux-ui-expert
description: Expert UX/UI audit and implementation for whitelabel public, auth, and member app zones. Applies Apple HIG, Material 3, Fluent, Stripe clarity, and mobile-first patterns. Use for login redesign, private area app shell, navigation, accessibility, and visual regression review.
---

# Progem UX/UI Expert

Auditoria e implementação de UX/UI para o whitelabel PROGEM. Aplica padrões Apple HIG, Material 3, Fluent, Stripe e mobile-first.

## Zonas do app

| Zona | Layout | Rotas | Chrome |
|------|--------|-------|--------|
| `public` | `PublicLayout` | `/`, `/planos/*`, memorial, legal | GlobalShell + Navbar + Footer + Dock |
| `auth` | `AuthLayout` | `/login`, `/criar-conta`, `/recuperar-senha` | Logo tenant, form centrado, sem marketing nav |
| `member` | `MemberLayout` → `AppShell` | `/area/*`, `/perfil`, `/carteirinha` | Sidebar desktop + bottom tab mobile |
| `print` | nenhum | `/carteirinha/print` | Sem chrome |

Ver matriz completa em [whitelabel-patterns.md](whitelabel-patterns.md).

## Workflow (5 fases)

### 1. Classificar zona

Identifique a rota alvo e a zona. Nunca misture chrome de marketing na área `member` ou `auth`.

### 2. Auditar

Checklist por zona:

**Public**
- [ ] Footer/Dock apropriados para a rota
- [ ] CTAs claros; hierarquia visual (hero → conteúdo → CTA)
- [ ] Tenant tokens via CSS vars (sem hardcode de cor)

**Auth**
- [ ] Sem Navbar/Footer/Dock
- [ ] 1 ação primária por tela
- [ ] Erro acima do form; focus no alerta
- [ ] max-width ~400px; card limpo estilo Stripe

**Member**
- [ ] AppShell ativo (sem GlobalShell marketing)
- [ ] Bottom tab mobile (5 destinos)
- [ ] Sidebar desktop
- [ ] `pb-20 md:pb-6` para safe area + tab bar
- [ ] `PrivateRoute` preserva `state.from`

**Global**
- [ ] Touch targets ≥44px (elder mode: ≥48px)
- [ ] Dark mode via `varsDark`
- [ ] `env(safe-area-inset-*)` em mobile
- [ ] Contraste WCAG AA

### 3. Propor

- Diff mínimo; reutilizar antes de criar
- Preferir: `Button.jsx`, `.btn`, `.card`, `.input`, CSS vars tenant
- Não alterar `theme-inline.js` ou tokens tenant sem Branding-Guardian

### 4. Implementar

Arquivos-chave:
- Layouts: `src/layouts/PublicLayout.jsx`, `AuthLayout.jsx`, `MemberLayout.jsx`, `AppShell.jsx`
- Rotas: `src/App.jsx` (nested routes)
- Design: `src/styles/theme.css`, `src/index.css`, `src/components/ui/Button.jsx`

### 5. Validar

- Viewports: 375px (mobile), 1280px (desktop)
- Dark mode + elder mode (`data-elder-mode=on`)
- Skill `branding-config-audit` após mudanças visuais

## Gates de bloqueio

| Condição | Severidade |
|----------|------------|
| Login com Navbar marketing visível | **BLOCK** |
| Área privada sem nav persistente mobile | **BLOCK** |
| Hardcode de cor bypassando CSS vars | **BLOCK** |
| Remover `PrivateRoute` ou `state.from` | **BLOCK** |
| Touch target <44px (elder off) | **WARN** |
| Duplicar Skeleton/Card inline | **WARN** |

## Princípios por plataforma

Resumo — detalhes em [reference.md](reference.md):

- **Apple:** 44px touch, safe areas, tab bar mobile member, auth sem distractors
- **Material 3:** bottom bar member, estados hover/focus/disabled/loading
- **Fluent:** densidade adaptável, feedback inline em forms
- **Stripe:** auth minimal (ident + senha + 1 CTA), cards financeiros limpos
- **Meta:** drawer só marketing; member ≤5 destinos primários

## Saída esperada

```markdown
# UX/UI Audit Report

**Rota:** /area
**Zona:** member
**Veredito:** PASS | WARN | BLOCK

## Heurísticas violadas
| Heurística | Severidade | Arquivo | Recomendação |
|------------|------------|---------|--------------|

## Mudanças propostas (ordenadas por impacto)
1. ...

## Validação
- [ ] Mobile 375px
- [ ] Desktop 1280px
- [ ] Dark mode
- [ ] branding-config-audit
```

## Referências

- [reference.md](reference.md) — Apple, Material, Fluent, Stripe, Meta
- [whitelabel-patterns.md](whitelabel-patterns.md) — regras deste repo
