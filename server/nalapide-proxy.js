// server/nalapide-proxy.js
import express from "express";

const router = express.Router();

/**
 * ✅ CRÍTICO:
 * Garantir parse do body + rawBody aqui.
 */
router.use(
  express.json({
    limit: process.env.NALAPIDE_BODY_LIMIT || "1mb",
    verify: (req, res, buf) => {
      try {
        req.rawBody = buf?.toString("utf8") || "";
      } catch {
        req.rawBody = "";
      }
    },
  })
);
router.use(express.urlencoded({ extended: true }));

const DEFAULT_UA =
  process.env.NALAPIDE_BFF_UA ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function getNalapideConfig() {
  const base = (
    process.env.NALAPIDE_API_BASE ||
    process.env.VITE_NALAPIDE_BASE ||
    ""
  ).replace(/\/+$/, "");

  const rawKey =
    process.env.NALAPIDE_API_KEY || process.env.VITE_NALAPIDE_API_KEY || "";

  let authHeader = { name: "x-api-key", value: rawKey };
  if (rawKey && rawKey.toLowerCase().startsWith("bearer ")) {
    authHeader = { name: "Authorization", value: rawKey };
  }

  return { base, rawKey, authHeader };
}

export function logNalapideBoot() {
  const { base, rawKey, authHeader } = getNalapideConfig();
  if (!base)
    console.warn(
      "[NaLapide] NALAPIDE_API_BASE ausente. Configure no .env do BFF"
    );
  if (!rawKey)
    console.warn(
      "[NaLapide] NALAPIDE_API_KEY ausente. Configure no .env do BFF"
    );
  console.log(
    "[NaLapide BFF] base=",
    base || "(ausente)",
    "| header=",
    authHeader.name
  );
}

const isProd = process.env.NODE_ENV === "production";

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}
function short(s, n = 220) {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function getTenant(req) {
  return req.headers["x-tenant-slug"] || req.query.tenant || req.body?.tenant;
}

function mustHaveTenant(req, res) {
  const tenant = getTenant(req);
  if (!tenant) {
    res.status(400).json({
      error: "TENANT_REQUIRED",
      message: "Informe o tenant via header x-tenant-slug (ou query/body).",
    });
    return false;
  }
  return true;
}

/* =========================
   LOG helpers (com redaction)
========================= */

function maskEmail(email) {
  const s = String(email || "").trim();
  if (!s || !s.includes("@")) return "[redacted]";
  const [user, domain] = s.split("@");
  const u = user.length <= 2 ? user[0] + "*" : user.slice(0, 2) + "***";
  return `${u}@${domain}`;
}

function maskPhone(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length < 6) return "[redacted]";
  return `${d.slice(0, 2)}*****${d.slice(-2)}`;
}

function summarizeText(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  return `[len=${s.length}] ${short(s, 60)}`;
}

function redactInteracaoPayload(p) {
  const o = p || {};
  const out = { ...o };

  if (out.email) out.email = maskEmail(out.email);
  if (out.telefone) out.telefone = maskPhone(out.telefone);
  if (out.mensagem) out.mensagem = summarizeText(out.mensagem);
  if (typeof out.nome === "string") out.nome = short(out.nome, 60);

  if (out?.obito?.id) out.obito = { id: String(out.obito.id) };

  return out;
}

function shouldLogPayload(req, path) {
  const flag = String(process.env.NALAPIDE_LOG_PAYLOAD || "").toLowerCase();
  const enabled = flag === "1" || flag === "true" || flag === "yes";
  if (!enabled) return false;
  if (req.method !== "POST") return false;
  return (
    path === "/interacoes" || path === "/obitos" || path === "/obitos/reacoes"
  );
}

/* =========================
   CONTRATO ÚNICO: TIPOS
   (DB deve receber só 4)
========================= */

/**
 * ✅ Contrato único (front e respostas do BFF):
 * "MENSAGEM" | "VELA" | "LIVRO" | "FLOR"
 */
const UI_TYPES = new Set(["MENSAGEM", "VELA", "LIVRO", "FLOR"]);

function normalizeUiTipo(uiTipo) {
  const raw = String(uiTipo || "").trim();
  if (!raw) return "MENSAGEM";

  const up = raw.toUpperCase();
  if (UI_TYPES.has(up)) return up;

  const low = raw.toLowerCase().replace(/\s+/g, "_");

  // Aceita legados e upstream, mas SEMPRE devolve um dos 4 oficiais
  const compat = {
    // atalhos
    mensagem: "MENSAGEM",
    vela: "VELA",
    livro: "LIVRO",
    flor: "FLOR",

    // contrato antigo do front
    mensagem_condolencia: "MENSAGEM",
    vela_digital: "VELA",
    livro_digital: "LIVRO",
    flor_digital: "FLOR",

    // upstream enums (caso chegue legado)
    mensagem_condolencia_up: "MENSAGEM",
    mensagem_condolencia: "MENSAGEM",
    acender_vela: "VELA",
    livro_visitas: "LIVRO",
    enviar_flor: "FLOR",

    // variações possíveis
    condolencia: "MENSAGEM",
  };

  return compat[low] || "MENSAGEM";
}

/**
 * ✅ UI -> Upstream (PASS-THROUGH)
 * Aqui é o ponto que estava errado: NÃO pode traduzir para livro_visitas etc.
 */
function mapTipoUiToUpstream(uiTipo) {
  return normalizeUiTipo(uiTipo); // ✅ envia só os 4 oficiais
}

/**
 * Upstream -> UI
 */
function mapTipoUpstreamToUi(upTipo) {
  return normalizeUiTipo(upTipo);
}

/**
 * Regra de ouro: se tem mensagem, sempre é MENSAGEM.
 */
function resolveTipoUiFromInteracao(interacao) {
  const msg = String(interacao?.mensagem || "").trim();
  if (msg) return "MENSAGEM";
  return mapTipoUpstreamToUi(interacao?.tipo);
}

/* =========================
   Schema estrito: normalização
========================= */

function onlyDigits(s) {
  return String(s || "").replace(/\D/g, "");
}
function isEmail(s) {
  const v = String(s || "").trim();
  return /.+@.+\..+/.test(v);
}

function normalizeCreateInteracaoStrict(obitoId, body) {
  const b = body || {};

  const nome = String(b.nome || "").trim();
  const mensagem = String(b.mensagem || "").trim();
  const contato = String(b.contato || "").trim();

  const incomingEmail = String(b.email || "").trim();
  const incomingTelefone = String(b.telefone || "").trim();

  if (!nome) {
    const err = new Error("NOME_REQUIRED");
    err.status = 400;
    throw err;
  }

  const email = incomingEmail || (isEmail(contato) ? contato : "");
  const telefone = incomingTelefone || (!email ? contato : "");

  // ✅ contrato novo entra aqui:
  const uiTipo = normalizeUiTipo(b.tipo);
  const upstreamTipo = mapTipoUiToUpstream(uiTipo); // ✅ agora retorna MENSAGEM|VELA|LIVRO|FLOR

  const clean = {
    obito: { id: obitoId },
    tipo: upstreamTipo, // ✅ DB/upstream recebe SOMENTE 4 tipos
    nome,
    ...(email ? { email } : {}),
    ...(telefone ? { telefone: telefone } : {}),
    ...(mensagem ? { mensagem } : {}),
  };

  if (clean.telefone) {
    const d = onlyDigits(clean.telefone);
    if (d.length >= 10) clean.telefone = d;
  }

  return clean;
}

/* =========================
   Inbound debug
========================= */
function logInbound(req, tag) {
  const tenant = getTenant(req);
  const ct = String(req.headers["content-type"] || "");
  const cl = String(req.headers["content-length"] || "");
  const hasRaw = Boolean(req.rawBody && String(req.rawBody).length);
  const rawPreview = hasRaw ? short(req.rawBody, 520) : "";
  const body = req.body;

  console.log(
    `[NaLapide BFF] ${nowIso()} ${tag}`,
    `| tenant=${tenant || "-"}`,
    `| ct=${ct || "-"}`,
    `| cl=${cl || "-"}`,
    `| hasRaw=${hasRaw}`,
    `| bodyType=${typeof body}`,
    `| bodyKeys=${
      body && typeof body === "object"
        ? Object.keys(body).join(",") || "-"
        : "-"
    }`,
    hasRaw ? `| raw=${rawPreview}` : ""
  );
}

/* =========================
   forward + response normalize
========================= */

async function forward(req, res, path) {
  const startedAt = Date.now();
  try {
    const { base: API_BASE, rawKey: RAW_KEY, authHeader: AUTH_HEADER } =
      getNalapideConfig();

    if (!API_BASE) {
      return res.status(500).json({
        error: "NALAPIDE_BASE_MISSING",
        message: "Configure NALAPIDE_API_BASE no .env (BFF)",
      });
    }
    if (!RAW_KEY) {
      return res.status(500).json({
        error: "NALAPIDE_KEY_MISSING",
        message: "Configure NALAPIDE_API_KEY no .env (BFF)",
      });
    }

    const urlObj = new URL(`${API_BASE}${path}`);
    const params = new URLSearchParams();

    for (const [k, v] of Object.entries(req.query || {})) {
      if (Array.isArray(v)) v.forEach((val) => params.append(k, String(val)));
      else if (v != null) params.set(k, String(v));
    }

    if (path === "/obitos" && !params.has("publico")) params.set("publico", "true");

    urlObj.search = params.toString();
    const url = urlObj.toString();

    const tenant = getTenant(req);

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": req.headers["user-agent"] || DEFAULT_UA,
      "Accept-Language":
        req.headers["accept-language"] || "pt-BR,pt;q=0.9,en;q=0.8",
      "x-from-bff": "vercel",
      [AUTH_HEADER.name]: AUTH_HEADER.value,
      ...(tenant ? { "x-tenant": tenant } : {}),
    };

    const init = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = JSON.stringify(req.body || {});
    }

    if (shouldLogPayload(req, path)) {
      console.log(
        `[NaLapide BFF] ${nowIso()} payload →`,
        path,
        `| tenant=${tenant || "-"}`,
        "| body=",
        redactInteracaoPayload(req.body)
      );
    }

    console.log(
      `[NaLapide BFF] ${nowIso()} →`,
      req.method,
      url,
      `| tenant=${tenant || "-"}`,
      `| hasBody=${Boolean(init.body)}`,
      `| rawLen=${req.rawBody ? String(req.rawBody).length : 0}`
    );

    const r = await fetch(url, init);
    const ct = r.headers.get("content-type") || "application/json";
    const txt = await r.text();
    const ms = Date.now() - startedAt;

    if (!r.ok) {
      console.error(
        `[NaLapide BFF] ${nowIso()} UPSTREAM ERROR`,
        r.status,
        ct,
        `| ms=${ms}`,
        "| body=",
        short(txt, 800)
      );
      if (!isProd && r.status === 400)
        console.error("[NaLapide BFF] 400 body (FULL):", txt);
      return res.status(r.status).type(ct).send(txt);
    }

    console.log(`[NaLapide BFF] ${nowIso()} ←`, r.status, ct, `| ms=${ms}`);

    /**
     * ✅ Blindagem: normaliza a resposta do POST /interacoes
     * Para a UI receber SEMPRE um dos 4 tipos oficiais.
     */
    if (
      path === "/interacoes" &&
      req.method === "POST" &&
      ct.includes("application/json")
    ) {
      let data;
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        return res.status(r.status).type(ct).send(txt);
      }

      // se o caller guardou o tipo escolhido, respeita na UI
      const chosen = normalizeUiTipo(req._uiTipoChosen);

      // regra de ouro: se houver mensagem, é MENSAGEM
      const safe = resolveTipoUiFromInteracao({ ...data, tipo: chosen });

      if (data && typeof data === "object") {
        data.tipo = safe;
      }

      return res.status(r.status).json(data);
    }

    // ✅ NORMALIZA LISTAGEM /interacoes/por-obito/*
    if (
      path.startsWith("/interacoes/por-obito/") &&
      ct.includes("application/json")
    ) {
      let data;
      try {
        data = txt ? JSON.parse(txt) : [];
      } catch {
        return res.status(r.status).type(ct).send(txt);
      }

      const normalizeArray = (arr) =>
        (arr || []).map((it) => ({
          ...it,
          tipo: resolveTipoUiFromInteracao(it), // -> MENSAGEM|VELA|LIVRO|FLOR
        }));

      if (Array.isArray(data)) {
        data = normalizeArray(data);
      } else if (data && Array.isArray(data.content)) {
        data = { ...data, content: normalizeArray(data.content) };
      } else if (data && Array.isArray(data.items)) {
        data = { ...data, items: normalizeArray(data.items) };
      }

      return res.status(r.status).json(data);
    }

    return res.status(r.status).type(ct).send(txt);
  } catch (err) {
    const status = Number(err?.status || 0);
    if (status >= 400 && status < 500) {
      const code = String(err?.message || "INVALID_PAYLOAD");
      return res.status(status).json({
        error: code,
        message:
          code === "NOME_REQUIRED"
            ? "Informe seu nome para enviar a homenagem."
            : "Payload inválido. Verifique os campos e tente novamente.",
      });
    }

    console.error(`[NaLapide BFF] ${nowIso()} ERRO:`, err);
    res.status(500).json({
      error: "BFF_NALAPIDE_ERROR",
      message: String(err?.message || err),
    });
  }
}

/** Rotas BFF -> NaLápide */
router.get("/_proxy/health", (req, res) => {
  const { base, rawKey, authHeader } = getNalapideConfig();
  res.json({
    ok: Boolean(base && rawKey),
    base,
    authHeader: authHeader.name,
    hasKey: Boolean(rawKey),
  });
});

router.get("/memorial", (req, res) => forward(req, res, "/obitos"));
router.get("/memorial/:slug", (req, res) =>
  forward(req, res, `/obitos/${encodeURIComponent(req.params.slug)}`)
);

router.post("/memorial/:id/reactions", (req, res) => {
  if (!mustHaveTenant(req, res)) return;
  return forward(req, res, `/obitos/${encodeURIComponent(req.params.id)}/reacoes`);
});

router.get("/memorial/:id/midias", (req, res) =>
  forward(req, res, `/obitos/${encodeURIComponent(req.params.id)}/midias`)
);

router.get("/memorial/:id/interacoes", (req, res) =>
  forward(req, res, `/interacoes/por-obito/${encodeURIComponent(req.params.id)}`)
);

router.post("/memorial/:id/interacoes", (req, res) => {
  if (!mustHaveTenant(req, res)) return;

  if (shouldLogPayload(req, "/interacoes")) {
    logInbound(req, "INBOUND /memorial/:id/interacoes");
    console.log(
      `[NaLapide BFF] ${nowIso()} raw  → /interacoes | tenant=${getTenant(req) || "-"} | body=`,
      redactInteracaoPayload(req.body)
    );
  }

  // ✅ guarda o tipo escolhido no front (contrato novo)
  req._uiTipoChosen = normalizeUiTipo(req.body?.tipo);

  try {
    req.body = normalizeCreateInteracaoStrict(req.params.id, req.body);
  } catch (e) {
    const status = Number(e?.status || 400);
    const code = String(e?.message || "INVALID_PAYLOAD");
    console.warn(
      `[NaLapide BFF] ${nowIso()} normalize FAIL`,
      `| tenant=${getTenant(req) || "-"}`,
      `| code=${code}`,
      `| rawLen=${req.rawBody ? String(req.rawBody).length : 0}`
    );
    return res.status(status).json({
      error: code,
      message:
        code === "NOME_REQUIRED"
          ? "Informe seu nome para enviar a homenagem."
          : "Payload inválido. Verifique os campos e tente novamente.",
    });
  }

  if (shouldLogPayload(req, "/interacoes")) {
    console.log(
      `[NaLapide BFF] ${nowIso()} norm → /interacoes | tenant=${getTenant(req) || "-"} | body=`,
      redactInteracaoPayload(req.body)
    );
  }

  return forward(req, res, `/interacoes`);
});

router.post("/leads", (req, res) => {
  if (!mustHaveTenant(req, res)) return;
  return forward(req, res, "/interacoes");
});

router.get("/produtos", (req, res) => forward(req, res, `/produtos`));

export default router;
