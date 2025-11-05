# Progem Site Integrado

Implementa telas e consultas do projeto em anexo:
- **Planos** (lista e detalhe) — `/api/v1/planos` e `/api/v1/planos/:id`
- **Contratos por CPF** — `/api/v1/contratos/cpf/:cpf`
- **Pagamentos/Parcelas do Contrato** — `/api/v1/contratos/:id/pagamentos`
- **Login** (empresa -> usuário) — `/api/v1/app/auth/login`
- **Client Token** — `/auth/client-token` (BFF busca via `client_credentials`)

## Rodando
1. Copie `.env.example` para `.env` e preencha `PROGEM_BASE`, `PROGEM_TENANT_ID`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`.
2. `npm install`
3. `npm run dev`
   - Frontend: http://localhost:5173
   - BFF/Proxy: http://localhost:${PORT:-8787}

> O BFF envia `X-Progem-ID`, opcional `X-API-KEY` e propaga `X-Device-ID` do cliente.
> O `/oauth2/token` é chamado com `application/x-www-form-urlencoded` (evita erro 415).

## Endpoints do BFF
- `POST /auth/client-token`
- `POST /api/v1/app/auth/login` → chama `${PROGEM_BASE}/v1/app/auth/login` com Bearer (client)
- `GET /api/v1/planos`
- `GET /api/v1/planos/:id`
- `GET /api/v1/contratos/cpf/:cpf`
- `GET /api/v1/contratos/:id/pagamentos`

## Notas
- O frontend injeta `X-Device-ID` (UUID persistido no `localStorage`).
- O Axios sempre envia `Authorization: Bearer`, priorizando o token do usuário, senão o token de cliente.


### Retrocompat de rotas
O BFF expõe **/api/v1/planos** e **/api/planos** (retrocompat). O frontend tenta `/api/v1/planos`, e faz fallback automático para `/api/planos` se houver 404/ERR_NETWORK.

### Dicas de diagnóstico rápido
- Verifique se o BFF sobe sem erros: `GET http://localhost:8787/health` → `{ ok: true }`
- Se `/auth/client-token` retornar 400: preencha `OAUTH_CLIENT_ID` e `OAUTH_CLIENT_SECRET` no `.env`.
- Se `/api/v1/planos` der 401: confira `X-Progem-ID` e permissões do client na API.

### Notas importantes do login (conforme Postman)
- **Token do cliente (OAuth2)**: `/oauth2/token` com **Basic Auth** e **body JSON** (`grant_type=client_credentials`, `scope`), e header **X-Progem-ID**.
- **Login do usuário**: **NÃO usa OAuth2**. É `POST /api/v1/app/auth/login` com **Bearer (token do cliente)** + `Content-Type: application/json` + `X-Progem-ID`.
- **Não usamos PROGEM_API_KEY** neste setup.

## 🏷️ Multi-Tenant / Whitelabel

Suporte a build por tenant com `theme-inline.js` aplicado no `<head>`.

### Criando um tenant
Crie `config/tenants/<slug>.json` (ex.: `patense.json`):

```json
{
  "slug": "patense",
  "v": 1,
  "vars": {
    "--primary": "#1E40AF",
    "--primary-dark": "#1E3A8A",
    "--on-primary": "#ffffff",
    "--surface": "#ffffff",
    "--text": "#0b1220",
    "--c-border": "rgba(0,0,0,0.08)"
  },
  "logo": "https://cdn.exemplo.com/logo.png",
  "domain": "cliente.com.br"
}
```

### Scripts
```bash
npm run build:tenant -- --tenant=patense
npm run preview:static
npm run dev:static
```

- `preview:static` e `dev:static` usam `VITE_DISABLE_BOOTSTRAP=1` para não chamar o BFF.
