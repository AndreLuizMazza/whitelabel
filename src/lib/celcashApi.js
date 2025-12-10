// src/lib/celcashApi.js
import api from '@/lib/api'

/**
 * Cria/atualiza cliente + contrato na CelCash
 * POST /api/celcash/clientes/contratos/:contratoId (BFF)
 */
export function celcashCriarClienteContrato(contratoId, payload = {}) {
  return api.post(`/api/celcash/clientes/contratos/${contratoId}`, payload)
}

/**
 * Gera carnê manual na CelCash
 * POST /api/v1/celcash/contratos/:contratoId/carne/manual (BFF)
 */
export function celcashGerarCarneManual(contratoId, payload) {
  return api.post(`/api/v1/celcash/contratos/${contratoId}/carne/manual`, payload)
}
