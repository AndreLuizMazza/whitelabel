/**
 * Chaves de localStorage para evitar misturar formatos no mesmo slot.
 * - tenant_contract_cache: snapshot do contrato (mesma forma que window.__TENANT__)
 * - tenant_empresa: objeto empresa da API (bootstrap / login)
 * - tenant_assets_revision: última assetsRevision aplicada via API pública
 * - tenant_branding_etag: ETag do GET /public/branding
 */
export const LS_TENANT_CONTRACT_KEY = "tenant_contract_cache";
export const LS_TENANT_EMPRESA_KEY = "tenant_empresa";
export const LS_TENANT_ASSETS_REVISION_KEY = "tenant_assets_revision";
export const LS_TENANT_BRANDING_ETAG_KEY = "tenant_branding_etag";
export const LS_TENANT_BRANDING_UPDATED_AT_KEY = "tenant_branding_updated_at";
