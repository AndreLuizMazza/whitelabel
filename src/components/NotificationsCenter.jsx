// src/components/NotificationsCenter.jsx
import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

/* ============================================================
   Helpers de formatação
   ============================================================ */

function fmtCurrencyBRL(v) {
  if (v == null) return "—"
  const num = Number(v)
  if (Number.isNaN(num)) return String(v)
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDatePT(d) {
  if (!d) return "—"
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [Y, M, D] = d.split("-")
    return `${D}/${M}/${Y}`
  }
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/* ============================================================
   Transforma “invoice.payment_failed” → “Invoice payment failed”
   ============================================================ */
function prettifyEventKey(eventKey = "") {
  if (!eventKey) return ""
  const cleaned = String(eventKey)
    .replace(/[:]/g, ".")
    .replace(/[_]/g, " ")
    .replace(/[.]/g, " · ")

  return cleaned
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
}

/* ============================================================
   Mapeamento técnico → linguagem humana
   ============================================================ */
function humanizeType(eventKey, status) {
  const key = String(eventKey || "").toLowerCase()
  const st = String(status || "").toUpperCase()

  // --- Pagamento confirmado
  if (
    key.includes("invoice") &&
    (key.includes("paid") || key.includes("payment_succeeded"))
  ) {
    return "Pagamento confirmado"
  }

  // --- Pagamento estornado
  if (
    key.includes("invoice") &&
    (key.includes("refunded") || key.includes("refund") || key.includes("reversed"))
  ) {
    return "Estorno de pagamento registrado"
  }

  // --- Parcela em atraso
  if (
    key.includes("invoice") &&
    (key.includes("overdue") ||
      key.includes("expired") ||
      key.includes("late") ||
      key.includes("past_due"))
  ) {
    return "Parcela em atraso"
  }

  // --- Nova parcela criada
  if (
    key.includes("invoice") &&
    (key.includes("created") ||
      key.includes("generated") ||
      key.includes("opened") ||
      key.includes("issued"))
  ) {
    return "Nova parcela gerada"
  }

  // --- Contrato ativado
  if (key.includes("contract") && key.includes("activated")) {
    return "Contrato ativado"
  }

  // --- Contrato cancelado
  if (key.includes("contract") && key.includes("canceled")) {
    return "Contrato cancelado"
  }

  // --- Contrato reativado
  if (key.includes("contract") && key.includes("reactivated")) {
    return "Contrato reativado"
  }

  // --- Atualização genérica de contrato
  if (key.includes("contract") && key.includes("updated")) {
    return "Dados do contrato atualizados"
  }

  // --- Fallback baseado em status
  if (st === "PAGA" || st === "PAID") return "Pagamento registrado"
  if (st === "ATRASADA" || st === "OVERDUE") return "Parcela em atraso"
  if (st === "ABERTA" || st === "OPEN") return "Parcela em aberto"

  // --- Fallback elegante
  const pretty = prettifyEventKey(eventKey)
  if (pretty) return pretty

  return "Atualização no seu contrato"
}

function humanizeStatus(status) {
  const key = String(status || "").toUpperCase()

  if (["PAGA", "PAID"].includes(key)) return "Pagamento registrado"
  if (["ABERTA", "OPEN"].includes(key)) return "Parcela em aberto"
  if (["ATRASADA", "OVERDUE"].includes(key)) return "Parcela em atraso"

  if (!status) return "Atualização registrada"
  return status
}

function resolveTone(status) {
  const key = String(status || "").toUpperCase()

  if (["PAGA", "PAID"].includes(key)) return "success"
  if (["ATRASADA", "OVERDUE"].includes(key)) return "danger"
  if (["ABERTA", "OPEN"].includes(key)) return "warning"

  return "neutral"
}

/* ============================================================
   Resolve ícone de acordo com o evento
   ============================================================ */
function resolveIcon(eventKey = "", tone = "neutral") {
  const key = String(eventKey).toLowerCase()

  if (key.includes("contract.activated")) return CheckCircle2
  if (key.includes("contract.canceled")) return XCircle

  // contrato reativado
  if (key.includes("contract.reactivated")) return CheckCircle2

  // pagamento estornado
  if (
    key.includes("invoice") &&
    (key.includes("refunded") || key.includes("refund") || key.includes("reversed"))
  ) {
    return XCircle
  }

  // pagamento confirmado
  if (key.includes("invoice") && key.includes("paid")) return CheckCircle2

  // atraso
  if (key.includes("overdue") || key.includes("past_due")) return XCircle

  // fallback
  return toneIcon(tone)
}

function toneIcon(tone) {
  if (tone === "success") return CheckCircle2
  if (tone === "warning") return Clock
  if (tone === "danger") return XCircle
  return AlertCircle
}

/* ============================================================
   Normalização de payload
   ============================================================ */
function normalizeNotification(raw) {
  if (!raw) return null

  const eventKey =
    raw.eventType ||
    raw.tipo ||
    raw.event ||
    raw.evento ||
    raw.kind ||
    ""

  const statusLabel = humanizeStatus(raw.status)
  const tone = resolveTone(raw.status)
  const title = humanizeType(eventKey, raw.status)
  const rawEventLabel = prettifyEventKey(eventKey)

  const id =
    raw.eventId ||
    raw.id ||
    `${eventKey || "evt"}-${raw.parcelaId || raw.numeroContrato || ""}`

  return {
    id,
    title,
    tone,
    statusLabel,
    rawEventLabel,
    contratoLabel: raw.numeroContrato ? `#${raw.numeroContrato}` : null,
    parcelaLabel: raw.parcelaId ? `Parcela ${raw.parcelaId}` : null,
    valorLabel: raw.valor != null ? fmtCurrencyBRL(raw.valor) : null,
    vencimentoLabel: raw.dataVenc ? fmtDatePT(raw.dataVenc) : null,
    pagoEmLabel: raw.pagoEm ? fmtDatePT(raw.pagoEm) : null,
    meioPagamento: raw.meioPagamento || raw.meio || null,
    receivedAtLabel: raw.receivedAt ? fmtDatePT(raw.receivedAt) : null,
    raw,
    eventKey,
  }
}

/* ============================================================
   Chip de status
   ============================================================ */
function statusChipStyle(tone) {
  const base =
    {
      success: {
        bg: "color-mix(in oklab, var(--c-success, #16a34a) 10%, transparent)",
        fg: "var(--c-success, #16a34a)",
      },
      warning: {
        bg: "color-mix(in oklab, #facc15 16%, transparent)",
        fg: "#a16207",
      },
      danger: {
        bg: "color-mix(in oklab, var(--c-danger, #dc2626) 10%, transparent)",
        fg: "var(--c-danger, #b91c1c)",
      },
      neutral: {
        bg: "color-mix(in oklab, var(--c-primary) 10%, transparent)",
        fg: "var(--c-primary)",
      },
    }[tone || "neutral"]

  return {
    background: base.bg,
    color: base.fg,
    border: "1px solid color-mix(in oklab, currentColor 25%, transparent)",
  }
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function NotificationsCenter({
  items = [],
  loading = false,
  contextKey = "default",
  onUnreadChange,
}) {
  const [open, setOpen] = useState(false)

  const normalized = useMemo(
    () =>
      (Array.isArray(items) ? items : [])
        .map(normalizeNotification)
        .filter(Boolean),
    [items]
  )

  const hasAlerts = normalized.length > 0
  const latest = hasAlerts ? normalized[0] : null

  const storageKey = `progem.notifications.lastSeen.${contextKey}`
  const panelId = `notifications-panel-${contextKey}`

  const [lastSeenId, setLastSeenId] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) || null
    } catch {
      return null
    }
  })

  // cálculo de não lidas priorizando o flag _read do store
  const unreadCount = useMemo(() => {
    if (!hasAlerts) return 0

    const withReadFlag = normalized.filter(
      (n) => n.raw && typeof n.raw._read === "boolean"
    )

    if (withReadFlag.length > 0) {
      return withReadFlag.filter((n) => !n.raw._read).length
    }

    if (!lastSeenId) return normalized.length

    const idx = normalized.findIndex((n) => n.id === lastSeenId)
    if (idx === -1) return normalized.length

    return idx
  }, [hasAlerts, normalized, lastSeenId])

  useEffect(() => {
    if (typeof onUnreadChange === "function") {
      onUnreadChange(unreadCount)
    }
  }, [unreadCount, onUnreadChange])

  useEffect(() => {
    if (!open || !hasAlerts) return

    const newestId = normalized[0]?.id
    if (newestId) {
      setLastSeenId(newestId)
      try {
        window.localStorage.setItem(storageKey, newestId)
      } catch {}
    }
  }, [open, hasAlerts, normalized, storageKey])

  const showBadge = unreadCount > 0
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount)

  const HeaderIcon = latest
    ? resolveIcon(latest.eventKey, latest.tone)
    : Bell

  const headerTone = latest?.tone || "neutral"

  return (
    <div
      className="card border rounded-2xl p-4 sm:p-5 text-xs sm:text-sm"
      id="alertas-automaticos"
      role="region"
      aria-label="Alertas automáticos do sistema"
      tabIndex={-1}
      style={{
        borderColor: "var(--c-border)",
        background:
          "radial-gradient(140% 140% at 0% 0%, color-mix(in oklab, var(--c-primary) 8%, transparent) 0%, transparent 55%), color-mix(in oklab, var(--c-surface, var(--surface)) 90%, var(--background) 10%)",
        boxShadow:
          "0 18px 40px rgba(15, 23, 42, 0.08), 0 0 0 1px color-mix(in oklab, var(--c-border) 80%, transparent)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 text-left"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className="flex items-start gap-3">
          <span
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border"
            style={{
              borderColor: "color-mix(in oklab, var(--c-border) 80%, transparent)",
              background:
                "radial-gradient(circle at 30% 0, color-mix(in oklab, var(--c-primary) 22%, transparent), transparent 65%), color-mix(in oklab, var(--c-surface, var(--surface)) 88%, var(--background) 12%)",
              boxShadow:
                "0 0 0 1px rgba(15, 23, 42, 0.02), 0 8px 18px rgba(15, 23, 42, 0.18)",
            }}
          >
            <HeaderIcon size={16} className="relative z-10" />
            {showBadge && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-semibold"
                style={{
                  background: "var(--c-badge, #f02849)",
                  color: "#fff",
                  border: "1px solid rgba(0,0,0,0.18)",
                  boxShadow: "0 0 0 2px rgba(248, 250, 252, 0.95)",
                }}
              >
                {badgeText}
              </span>
            )}
          </span>

          <div className="space-y-0.5">
            <p className="font-semibold flex flex-wrap items-center gap-1 text-[0.85rem]">
              Alertas do seu plano
              {loading && (
                <span className="inline-flex items-center gap-1 text-[0.7rem] opacity-60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse bg-[var(--c-primary)]" />
                  atualizando…
                </span>
              )}
              {!loading && unreadCount > 0 && (
                <span className="text-[0.7rem] opacity-75 ml-1">
                  • {unreadCount} novo{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
            <p
              className="text-[0.7rem] opacity-75"
              style={{ color: "color-mix(in oklab, var(--text) 80%, var(--text-muted) 20%)" }}
            >
              Acompanhe pagamentos, vencimentos e outras atualizações importantes
              do seu contrato em um só lugar.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {hasAlerts && latest && (
            <span
              className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium"
              style={{
                ...statusChipStyle(headerTone),
                background:
                  "color-mix(in oklab, var(--c-surface, var(--surface)) 80%, currentColor 10%)",
              }}
            >
              <HeaderIcon size={10} className="mr-1" />
              {latest.title}
            </span>
          )}
          <span className="inline-flex items-center text-[0.7rem] opacity-80">
            {open ? "Recolher histórico" : "Ver histórico de alertas"}
            {open ? (
              <ChevronUp size={12} className="ml-1" aria-hidden="true" />
            ) : (
              <ChevronDown size={12} className="ml-1" aria-hidden="true" />
            )}
          </span>
        </div>
      </button>

      {/* PRÉVIA DO ÚLTIMO ALERTA */}
      {hasAlerts && latest && (
        <div className="mt-3 rounded-2xl border px-3 py-2.5"
             style={{
               borderColor: "color-mix(in oklab, var(--c-border) 80%, transparent)",
               background:
                 "color-mix(in oklab, var(--c-surface, var(--surface)) 88%, var(--background) 12%)",
             }}>
          <p className="text-[0.65rem] uppercase tracking-[0.16em] font-semibold opacity-60 mb-1.5">
            Última atualização
          </p>
          {renderNotificationRow(latest, {
            isNew: unreadCount > 0,
            compact: !open,
          })}
        </div>
      )}

      {/* LISTA COMPLETA */}
      {hasAlerts && open && normalized.length > 1 && (
        <div
          id={panelId}
          className="mt-3 max-h-60 overflow-y-auto pr-1 space-y-1.5"
          role="list"
          aria-label="Histórico de alertas"
        >
          {normalized.slice(1).map((item) => {
            const isNew =
              item.raw && typeof item.raw._read === "boolean"
                ? !item.raw._read
                : false

            return (
              <div key={item.id} role="listitem">
                {renderNotificationRow(item, { isNew, compact: false })}
              </div>
            )
          })}
        </div>
      )}

      {!hasAlerts && !loading && (
        <p className="mt-3 text-[0.7rem] opacity-75">
          Assim que o sistema receber atualizações sobre seu contrato, elas
          aparecerão aqui.
        </p>
      )}
    </div>
  )
}

/* ============================================================
   Linha de notificação estilo feed premium
   ============================================================ */

function renderNotificationRow(item, { isNew, compact }) {
  const Icon = resolveIcon(item.eventKey, item.tone)

  const highlightBase = isNew
    ? {
        background:
          "color-mix(in oklab, var(--c-primary) 8%, transparent)",
        borderColor:
          "color-mix(in oklab, var(--c-primary) 40%, var(--c-border) 60%)",
      }
    : {
        background:
          "color-mix(in oklab, var(--c-surface, var(--surface)) 92%, var(--background) 8%)",
        borderColor:
          "color-mix(in oklab, var(--c-border) 80%, transparent)",
      }

  return (
    <article
      className="flex items-start gap-2.5 rounded-xl border px-2.5 py-2"
      style={highlightBase}
    >
      <div className="mt-0.5 relative">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full"
          style={statusChipStyle(item.tone)}
        >
          <Icon size={12} />
        </span>
        {isNew && (
          <span
            className="absolute -top-0.5 -right-0.5 inline-flex h-2 w-2 rounded-full"
            style={{
              background:
                "color-mix(in oklab, var(--c-primary) 70%, #f97316 30%)",
              boxShadow: "0 0 0 4px rgba(248, 250, 252, 0.9)",
            }}
            aria-label="Notificação não lida"
          />
        )}
      </div>

      <div className="flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-[0.8rem]">
            {item.title}
          </span>
          {item.receivedAtLabel && (
            <span className="text-[0.7rem] opacity-60 whitespace-nowrap">
              {item.receivedAtLabel}
            </span>
          )}
        </div>

        {/* Subtítulo técnico opcional, discreto */}
        {item.rawEventLabel &&
          item.rawEventLabel.toLowerCase() !==
            item.title.toLowerCase() && (
            <p className="text-[0.68rem] opacity-55">
              {item.rawEventLabel}
            </p>
          )}

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] opacity-80">
          {item.contratoLabel && (
            <span>
              <strong>Contrato:</strong> {item.contratoLabel}
            </span>
          )}
          {item.parcelaLabel && (
            <span>
              <strong>{item.parcelaLabel}</strong>
            </span>
          )}
          {item.valorLabel && (
            <span>
              <strong>Valor:</strong> {item.valorLabel}
            </span>
          )}
          {item.vencimentoLabel && (
            <span>
              <strong>Vencimento:</strong> {item.vencimentoLabel}
            </span>
          )}
          {!compact && item.pagoEmLabel && (
            <span>
              <strong>Pago em:</strong> {item.pagoEmLabel}
            </span>
          )}
          {!compact && item.meioPagamento && (
            <span>
              <strong>Meio de pagamento:</strong> {item.meioPagamento}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
