# UX/UI Reference — Big Tech Patterns

Princípios condensados para aplicar no whitelabel PROGEM.

## Apple Human Interface Guidelines

**Touch & layout**
- Minimum touch target: 44×44 pt (web: 44px)
- Safe areas: `padding-bottom: env(safe-area-inset-bottom)` on fixed bottom nav
- One primary action per screen in auth flows

**Navigation**
- Tab bar (mobile): 3–5 items, icons + short labels, persistent in member zone
- Sidebar (desktop): persistent for app-like areas
- Avoid stacking tab bar + hamburger for same destinations

**Auth**
- No marketing chrome during sign-in
- Clear hierarchy: logo → title → form → single CTA
- Inline validation with focus management on errors

## Google Material Design 3

**Navigation**
- Navigation bar (bottom): primary destinations in member app
- Navigation rail (sidebar): desktop equivalent
- Active state: filled icon + label color `--primary`

**Components**
- Explicit states: default, hover, focus-visible, disabled, loading
- Typography scale: display → headline → title → body → label
- Elevation via border + subtle shadow, not heavy drop shadows

**Forms**
- Outlined or filled inputs with clear labels
- Error text below field; summary alert for submit failures

## Microsoft Fluent Design

**Density**
- Comfortable spacing in member dashboards
- Compact only for data-dense tables (pagamentos)

**Feedback**
- Immediate inline validation (login already partial)
- Loading spinners on primary buttons, not full-page unless necessary

**Dark mode**
- Use tenant `varsDark`; never invert colors manually
- Borders: `var(--c-border)` with higher opacity in dark

## Stripe (clarity & trust)

**Auth screens**
- Centered card, max-width ~400px
- Fields: identifier, password, forgot link, one primary button
- No secondary marketing column on login
- Error banner above form fields
- Subtle footer: LGPD / support link

**Financial UI (AreaUsuario)**
- Preserve "bank style" cards for plan/payment highlights
- Clear hierarchy: greeting → primary card → quick actions
- Hide sensitive values toggle (already present)

## Meta (mobile engagement)

**Public vs private**
- Marketing drawer/hamburger only on public routes
- Member zone: persistent bottom nav, no full-site menu overlay
- Reduce post-login friction: redirect to `state.from` (PrivateRoute)

**Engagement**
- ≤5 primary destinations in member tab bar
- Notifications bell in member header (already in AppShell)

## Accessibility (cross-platform)

- WCAG 2.1 AA contrast for text on `--surface`
- `aria-live="assertive"` on auth errors
- `aria-invalid` on invalid fields
- Focus trap not required on login; focus error alert on submit fail
- Elder mode: `html[data-elder-mode=on]` scales fonts and touch targets in `index.css`

## Anti-patterns (avoid)

- Dual nav on same viewport (GlobalShell sidebar + Navbar center links on `/area`)
- Hardcoded `#hex` bypassing `--primary`
- 521-line login with 3 register CTAs
- Per-page Skeleton duplication without shared component
- Fallback routes that don't exist (`/area-do-associado`)
