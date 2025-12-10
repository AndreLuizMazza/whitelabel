import express from "express";

const router = express.Router();

const MAX_HISTORY = 20;
const latestEventsByCpf = new Map();
const eventsByCpf = new Map();

const normalizeCpf = (cpf = "") => String(cpf).replace(/\D/g, "");

router.post("/", (req, res) => {
  let event;

  try {
    if (Buffer.isBuffer(req.body)) event = JSON.parse(req.body.toString("utf8"));
    else if (typeof req.body === "string") event = JSON.parse(req.body);
    else event = req.body || {};
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const {
    id,
    eventType,
    payload,
    empresaId,
    createdAt,
    evento,
    contrato,
    parcela,
    cliente,
  } = event;

  const tipoEvento =
    eventType ||
    evento ||
    payload?.eventType ||
    payload?.evento ||
    null;

  const contratoId =
    payload?.contrato?.id || contrato?.id || null;

  const numeroContrato =
    payload?.contrato?.numero ||
    contrato?.numero ||
    null;

  const parcelaObj = payload?.parcela || parcela || null;

  const normalized = {
    empresaId,
    eventId: id,
    eventType: tipoEvento,
    createdAt: createdAt ?? new Date().toISOString(),
    contratoId,
    numeroContrato,
    parcelaId: parcelaObj?.id ?? null,
    status: parcelaObj?.status ?? null,
    valor: parcelaObj?.valor ?? null,
    dataVenc: parcelaObj?.dataVencimento ?? null,
    pagoEm: parcelaObj?.pagaEm ?? parcelaObj?.pagoEm ?? null,
    meioPagamento: parcelaObj?.meio ?? null,
    clienteNome: cliente?.nome ?? null,
    clienteCpf: cliente?.cpf ?? null,
    receivedAt: new Date().toISOString(),
  };

  const cpfKey = normalizeCpf(cliente?.cpf ?? "");

  if (cpfKey) {
    latestEventsByCpf.set(cpfKey, normalized);

    const history = eventsByCpf.get(cpfKey) || [];
    history.unshift(normalized);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    eventsByCpf.set(cpfKey, history);
  }

  return res.json({ ok: true });
});

router.get("/last", (req, res) => {
  const cpf = normalizeCpf(req.query.cpf);
  if (!cpf) return res.status(400).json({ error: "cpf obrigatório" });
  return res.json(latestEventsByCpf.get(cpf) || null);
});

router.get("/history", (req, res) => {
  const cpf = normalizeCpf(req.query.cpf);
  if (!cpf) return res.status(400).json({ error: "cpf obrigatório" });

  const limit = Math.min(
    MAX_HISTORY,
    Math.max(1, parseInt(req.query.limit ?? "10", 10))
  );

  const history = eventsByCpf.get(cpf) || [];
  return res.json(history.slice(0, limit));
});

export default router;
