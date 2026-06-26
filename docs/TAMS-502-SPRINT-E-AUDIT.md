# TAMS-502 — Sprint E: Auditoria UI/UX institucional

## Veredito final (pós Must ship)

**Nível: 8,5 / 10** — home institucional multitenant pronta para QA tenant.

Evolução: **6,5 → 8,3 → 8,5** após unificação funil B2B + rename semântico Clube vs Parcerias.

### Critérios de aceite (meta 8+/10)

- [x] Um caminho de conversão primário claro acima da dobra (adesão/planos)
- [x] Home com blocos distintos e ritmo visual (bands alternadas)
- [x] Seção app sem botões desabilitados; install via loja ou PWA
- [x] Tipografia, spacing e largura consistentes (tokens `.public-*`)
- [x] Funil B2B unificado (`src/lib/partnerFunnel.js` → WhatsApp tenant ou `/#parceiros`)
- [x] Semântica: **Clube de benefícios** (B2C) vs **Parcerias comerciais** (B2B)
- [ ] Lighthouse a11y ≥ 90 na home (mobile) — rodar antes de release
- [x] `npm run build:tenant` OK

### Funil B2B unificado

| Ponto de contato | Destino |
|---|---|
| Hero slide `id: parceiros` | WhatsApp tenant (ou `/#parceiros`) |
| Seção `ParceirosCTA` | WhatsApp + mensagem pronta |
| Footer legal | Parcerias comerciais → WhatsApp |
| `ClubeBeneficios` compact CTA | WhatsApp (fallback âncora) |
| JSON tenant com `wa.me` explícito | Preservado (override local) |

Mensagem padrão: *Olá! Tenho interesse em ser parceiro premium e gostaria de mais informações.*

### Ordem da home

```
Hero → Quick access → Planos → Clube → Como funciona → Parceiros → App → FAQ
```

### Smoke manual (antes de release)

| Cenário | Tenant sugerido | Verificar |
|---|---|---|
| Benefícios ON | demo / saobento | Clube preview + kickers corretos |
| Benefícios OFF | tenant sem módulo | Sem clube; resto OK |
| Tema escuro | demo dark | Contraste CTAs hero + bands |
| Hero slide parceiros | riolife / alianca | CTA abre WhatsApp (não `/beneficios`) |
| Sem telefone tenant | env sem VITE_WHATSAPP | CTA parceiros → `/#parceiros` |
| Mobile 375px | qualquer | Separação Como funciona / Parceiros / App |
| Capacitor | app nativo | Sem seções Parceiros/App web |

### Pendências pós-fase (Should / Nice)

- Lighthouse mobile gate documentado no PR
- Code-split home (bundle ~1,8 MB)
- Visual regression por tenant (Playwright)
