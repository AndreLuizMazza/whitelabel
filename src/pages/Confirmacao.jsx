// src/pages/Confirmacao.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import CTAButton from "@/components/ui/CTAButton";
import useAuth from "@/store/auth";

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

export default function Confirmacao() {
  const q = useQuery();
  const navigate = useNavigate();
  const isAuth = useAuth((s) =>
    typeof s.isAuthenticated === "function" ? s.isAuthenticated() : !!s.token
  );

  const contratoId = q.get("contrato");
  const [copied, setCopied] = useState(false);
  const copyT = useRef(null);

  const pagamentosPath = contratoId
    ? `/contratos/${encodeURIComponent(contratoId)}/pagamentos`
    : null;

  // Redireciona suave para /area se já estiver autenticado
  useEffect(() => {
    if (!isAuth) return;
    const t = setTimeout(() => {
      navigate("/area", { replace: true });
    }, 2500);
    return () => clearTimeout(t);
  }, [isAuth, navigate]);

  async function copyContrato() {
    if (!contratoId) return;
    try {
      await navigator.clipboard.writeText(String(contratoId));
      setCopied(true);
      if (copyT.current) clearTimeout(copyT.current);
      copyT.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      // falha silenciosa
    }
  }

  const whatsNumber =
    (import.meta?.env?.VITE_WHATSAPP || window.__WHATSAPP__) || "";

  const whatsappMsg = (() => {
    const linhas = [];
    linhas.push("*Confirmação de Contrato*");
    if (contratoId) linhas.push(`Contrato: ${contratoId}`);
    if (pagamentosPath) {
      const url = `${window.location.origin}${pagamentosPath}`;
      linhas.push("");
      linhas.push(`Segunda via / pagamento: ${url}`);
    }
    return linhas.join("\n");
  })();

  // ======= layout quando NÃO há contratoId (fluxo genérico) =======
  if (!contratoId) {
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
                style={{
                  background: "color-mix(in srgb, var(--primary) 90%, black)",
                }}
                aria-hidden
              >
                <CheckCircle2 size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Tudo certo com sua solicitação
                </h1>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Seus dados foram recebidos. Você poderá acompanhar os detalhes
                  na{" "}
                  <Link
                    to="/area"
                    className="underline"
                    style={{ color: "var(--primary)" }}
                  >
                    área do associado
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <CTAButton
                className="h-11 w-full"
                onClick={() => navigate("/area")}
              >
                Ir para área do associado{" "}
                <ChevronRight size={16} className="ml-2" />
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

            {isAuth && (
              <p
                className="mt-3 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Você já está logado. Vamos te levar para a área do associado
                automaticamente.
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ======= layout principal simplificado quando há contratoId =======
  return (
    <section className="section">
      <div className="container-max max-w-3xl">
        <div
          className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-lg"
          role="status"
          aria-live="polite"
        >
          {/* Cabeçalho de sucesso */}
          <div className="flex items-start gap-3">
            <div
              className="rounded-full p-2 text-white shrink-0"
              style={{
                background: "color-mix(in srgb, var(--primary) 90%, black)",
              }}
              aria-hidden
            >
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight">
                Tudo certo com sua contratação
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Seu contrato foi criado com sucesso. Você pode acompanhar os
                detalhes e pagamentos na área do associado.
              </p>
            </div>
          </div>

          {/* Número do contrato em destaque */}
          <div className="mt-6 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface-alt)]/60 p-4">
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Número do contrato
            </div>
            <div className="mt-1 font-mono text-lg font-semibold break-all">
              {contratoId}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copyContrato}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-3 py-1.5 text-xs hover:bg-[var(--c-surface)]"
                aria-label="Copiar número do contrato"
                title="Copiar número do contrato"
              >
                {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
                {copied ? "Copiado!" : "Copiar número"}
              </button>

              {whatsNumber && (
                <button
                  type="button"
                  onClick={() => openWhatsApp(whatsNumber, whatsappMsg)}
                  className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-xs"
                  style={{ color: "var(--primary)" }}
                  title="Enviar confirmação por WhatsApp"
                >
                  <MessageCircle size={14} />
                  Enviar por WhatsApp
                </button>
              )}
            </div>

            <p
              className="mt-2 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Guarde este número. Ele identifica o seu contrato em nossos
              canais de atendimento.
            </p>
          </div>

          {/* CTAs principais enxutos */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <CTAButton
              className="h-11 w-full"
              onClick={() => navigate("/area")}
            >
              Acessar área do associado{" "}
              <ChevronRight size={16} className="ml-2" />
            </CTAButton>

            {pagamentosPath ? (
              <Link
                to={pagamentosPath}
                className="h-11 inline-flex items-center justify-center rounded-full border border-[var(--c-border)] text-sm hover:bg-[var(--c-surface-alt)]"
                title="Ver pagamentos e segunda via"
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
                Voltar ao início
              </CTAButton>
            )}
          </div>

          {isAuth && (
            <p
              className="mt-3 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Você já está logado. Em instantes, vamos te levar para a área do
              associado automaticamente.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
