export const EVENT_PATTERNS = [
  // ==================== PAGAMENTOS ====================
  {
    match: /invoice.*paid|payment.*succeeded/i,
    title: "Pagamento confirmado",
    tone: "success",
    icon: "check",
  },
  {
    // NOVO: pagamento estornado
    match: /(invoice.*refunded|payment.*refunded|reversed)/i,
    title: "Pagamento estornado",
    tone: "danger",
    icon: "x",
  },
  {
    match: /invoice.*failed|payment.*failed/i,
    title: "Falha no pagamento",
    tone: "danger",
    icon: "x",
  },
  {
    match: /invoice.*overdue|expired|late|past_due/i,
    title: "Parcela em atraso",
    tone: "danger",
    icon: "x",
  },
  {
    match: /invoice.*created|generated|opened|issued/i,
    title: "Nova parcela criada",
    tone: "neutral",
    icon: "alert",
  },

  // ==================== CONTRATOS ====================
  {
    match: /contract.*activated|subscription.*activated/i,
    title: "Contrato ativado",
    tone: "success",
    icon: "check",
  },
  {
    match: /contract.*canceled|subscription.*canceled/i,
    title: "Contrato cancelado",
    tone: "danger",
    icon: "x",
  },
  {
    // NOVO: contrato reativado
    match: /contract.*reactivated|subscription.*reactivated/i,
    title: "Contrato reativado",
    tone: "success",
    icon: "check",
  },
  {
    match: /contract.*updated|subscription.*updated/i,
    title: "Contrato atualizado",
    tone: "neutral",
    icon: "alert",
  },

  // FALLBACK
  { match: /.*/, title: null, tone: "neutral", icon: "alert" },
]
