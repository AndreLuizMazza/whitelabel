/**
 * Chaves de localStorage para evitar misturar formatos no mesmo slot.
 * - tenant_contract_cache: snapshot do contrato (mesma forma que window.__TENANT__)
 * - tenant_empresa: objeto empresa da API (bootstrap / login)
 */
export const LS_TENANT_CONTRACT_KEY = "tenant_contract_cache";
export const LS_TENANT_EMPRESA_KEY = "tenant_empresa";
