// src/pages/Confirmacao.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  ChevronRight,
  ExternalLink,
  Loader2,
  MessageCircle
} from "lucide-react";
import CTAButton from "@/components/ui/CTAButton";
import useAuth from "@/store/auth";
import api from "@/lib/api";

// --- helpers simples ---
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}
const onlyDigits = (v = "") => String(v).replace(/\D+/g, "");
function openWhatsApp(numberOrNull, message) {
  const n = numberOrNull ? onlyDigits(numberOrNull) : "";
  const text = encodeURIComponent(message || "");
  const url = n ? `https://wa.me/${n}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, "_blank", "noopener");
}
const money = (v) =>
  (typeof v === "number" && !Number.isNaN(v))
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

// tenta mapear campos com nomes diferentes
function mapContratoAPI(data) {
  if (!data || typeof data !== "object") return {};
  const planoNome =
    data?.plano?.nome || data?.planoNome || data?.plano?.descricao || null;

  // status/situação
  const status =
    data?.situacao ||
    data?.status ||
    data?.situacaoAtual ||
    data?.statusAtual ||
    null;

  // valor mensal
  const valorMensal =
    Number(
      data?.valorMensal ??
      data?.valor_mensal ??
      data?.valorMensalidade ??
      data?.mensalidade ??
      data?.valor
    ) || null;

  // vencimento/dia de debito
  const venc =
    data?.vencimento ||
    data?.proximaParcela?.vencimento ||
    data?.diaVencimento ||
    data?.diaD ||
    null;

  // id do titular se houver
  const titularId =
    data?.titularId || data?.titular?.id || data?.pessoaId || null;

  return { planoNome, status, valorMensal, venc, titularId };
}

export default function Confirmacao() {
  const q = useQuery();
  const navigate = useNavigate();
  const isAuth = useAuth((s) =>
    typeof s.isAuthenticated === "function" ? s.isAuthenticated() : !!s.token
  );

  const contratoId = q.get("contrato");
  const titularIdQuery = q.get("titular");

  const [copied, setCopied] = useState(false);
  const copyT = useRef(null);

  // status do contrato
  const [loadingContrato, setLoadingContrato] = useState(false);
  const [contratoErr, setContratoErr] = useState("");
  const [contratoInfo, setContratoInfo] = useState({
    planoNome: null,
    status: null,
    valorMensal: null,
    venc: null,
    titularId: titularIdQuery || null
  });

  // Redireciono suave para /area se já estiver autenticado
  useEffect(() => {
    if (!isAuth) return;
    const t = setTimeout(() => {
      navigate("/area", { replace: true });
    }, 2500);
    return () => clearTimeout(t);
  }, [isAuth, navigate]);

  // Busca status do contrato (best-effort, não bloqueia UI)
  useEffect(() => {
    if (!contratoId) return;
    let active = true;
    (async () => {
      setLoadingContrato(true);
      setContratoErr("");
      try {
        // tenta sem header auth (rota pública pode existir)
        let data;
        try {
          const res = await api.get(`/api/v1/contratos/${encodeURIComponent(contratoId)}`, {
            transformRequest: [(d, headers) => { try { delete headers.Authorization; } catch {} return d; }]
          });
          data = res?.data;
        } catch {
          // fallback: com header normal (se sessão existir)
          const res2 = await api.get(`/api/v1/contratos/${encodeURIComponent(contratoId)}`);
          data = res2?.data;
        }
        if (!active) return;
        const mapped = mapContratoAPI(data);
        setContratoInfo((prev) => ({ ...prev, ...mapped }));
      } catch (err) {
        if (!active) return;
        setContratoErr("Não foi possível obter os detalhes do contrato agora.");
      } finally {
        if (active) setLoadingContrato(false);
      }
    })();
    return () => { active = false; };
  }, [contratoId]);

  const pagamentosPath = contratoId ? `/contratos/${encodeURIComponent(contratoId)}/pagamentos` : null;

  async function copyContrato() {
    try {
      await navigator.clipboard.writeText(String(contratoId || ""));
      setCopied(true);
      if (copyT.current) clearTimeout(copyT.current);
      copyT.current = setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  // monta mensagem de WhatsApp
  const whatsNumber = (import.meta?.env?.VITE_WHATSAPP || window.__WHATSAPP__) || "";
  const whatsappMsg = (() => {
    const linhas = [];
    linhas.push("*Confirmação de Contrato*");
    if (contratoInfo.planoNome) linhas.push(`Plano: ${contratoInfo.planoNome}`);
    if (contratoId) linhas.push(`Contrato: ${contratoId}`);
    if (contratoInfo.status) linhas.push(`Status: ${contratoInfo.status}`);
    if (contratoInfo.valorMensal) linhas.push(`Mensalidade: ${money(contratoInfo.valorMensal)}`);
    if (contratoInfo.venc) linhas.push(`Vencimento/Dia: ${contratoInfo.venc}`);
    if (pagamentosPath) {
      const url = `${window.location.origin}${pagamentosPath}`;
      linhas.push("");
      linhas.push(`2ª via / Pagamento: ${url}`);
    }
    return linhas.join("\n");
  })();

  // Fallback quando não há ID de contrato
  if (!contratoId) {
    return (
      <section className="section">
        <div className="container-max max-w-3xl">
          <div
            className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 text-center"
            role="status"
          >
            <h1 className="text-2xl font-extrabold tracking-tight">Recebemos seus dados</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Sua solicitação foi enviada com sucesso. Em instantes você poderá acompanhar na{" "}
              <Link to="/area" className="underline" style={{ color: "var(--primary)" }}>
                área do associado
              </Link>.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <CTAButton className="h-11 w-full" onClick={() => navigate("/area")}>
                Ir para área do associado <ChevronRight size={16} className="ml-2" />
              </CTAButton>
              <CTAButton
                variant="outline"
                className="h-11 w-full"
                onClick={() => navigate("/")}
                title="Voltar para a página inicial"
              >
                Voltar ao início
              </CTAButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-max max-w-3xl">
        <div
          className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div
              className="rounded-full p-2 text-white shrink-0"
              style={{ background: "color-mix(in srgb, var(--primary) 90%, black)" }}
              aria-hidden
            >
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight">
                Contratação concluída com sucesso
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Seu contrato foi criado e já está disponível para consulta e pagamento.
              </p>
            </div>
          </div>

          {/* Card com dados principais */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--c-border)] p-4">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Nº do contrato
              </div>
              <div className="mt-1 font-mono text-base font-semibold break-all">
                {contratoId}
              </div>
              <button
                type="button"
                onClick={copyContrato}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-3 py-1.5 text-xs hover:bg-[var(--c-surface-alt)]"
                aria-label="Copiar número do contrato"
                title="Copiar número do contrato"
              >
                {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <div className="rounded-xl border border-[var(--c-border)] p-4">
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Titular (ID)
              </div>
              <div className="mt-1 font-mono text-base font-semibold break-all">
                {contratoInfo.titularId || "—"}
              </div>

              {/* Link para pagamentos (rota pública) */}
              <div className="mt-3">
                {pagamentosPath && (
                  <Link
                    to={pagamentosPath}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-3 py-1.5 text-xs hover:bg-[var(--c-surface-alt)]"
                    title="Ver pagamentos / segunda via"
                  >
                    Ver pagamentos <ExternalLink size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Status do contrato */}
          <div className="mt-4 rounded-xl border border-[var(--c-border)] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Status do contrato</h3>
              {loadingContrato && (
                <span className="inline-flex items-center text-xs" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={14} className="mr-1 animate-spin" /> atualizando…
                </span>
              )}
            </div>

            {contratoErr ? (
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{contratoErr}</p>
            ) : (
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Plano</span>
                  <span className="font-medium">{contratoInfo.planoNome || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Situação</span>
                  <span className="font-medium">{contratoInfo.status || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Mensalidade</span>
                  <span className="font-medium">{money(contratoInfo.valorMensal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Vencimento/Dia</span>
                  <span className="font-medium">{contratoInfo.venc || "—"}</span>
                </div>
              </div>
            )}

            {/* CTA WhatsApp com mensagem pronta */}
            <div className="mt-4">
              <CTAButton
                variant="outline"
                className="h-11 w-full sm:w-auto justify-center"
                onClick={() => openWhatsApp(whatsNumber, whatsappMsg)}
                title="Enviar confirmação por WhatsApp"
              >
                <MessageCircle size={16} className="mr-2" />
                Enviar por WhatsApp
              </CTAButton>
            </div>
          </div>

          {/* CTAs principais */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <CTAButton className="h-11 w-full" onClick={() => navigate("/area")}>
              Acessar área do associado <ChevronRight size={16} className="ml-2" />
            </CTAButton>

            {pagamentosPath ? (
              <Link
                to={pagamentosPath}
                className="btn-outline h-11 inline-flex items-center justify-center rounded-xl"
                title="Abrir pagamentos / segunda via"
              >
                Segunda via / pagamento
              </Link>
            ) : (
              <CTAButton
                variant="outline"
                className="h-11 w-full"
                onClick={() => navigate("/")}
                title="Voltar ao início"
              >
                Início
              </CTAButton>
            )}
          </div>

          {/* Hint de redirecionamento automático */}
          {isAuth && (
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Você já está logado. Vamos te levar para a área do associado automaticamente.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
