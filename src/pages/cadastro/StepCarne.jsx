// src/pages/cadastro/StepCarne.jsx
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CTAButton from "@/components/ui/CTAButton";
import { DIA_D_OPTIONS, PARENTESCO_LABELS } from "@/lib/constants";
import { money } from "@/lib/planUtils";
import { formatDateBR } from "@/lib/br";
import api from "@/lib/api.js";
import { Loader2 } from "lucide-react";

/* ---------------- util ---------------- */
function round2(v) {
  const n = Number(v || 0);
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function clampMin0(v) {
  return Math.max(0, Number(v || 0));
}
function applyDiscountToValue(originalValue, cupom) {
  const base = Number(originalValue || 0);
  if (!cupom) return { final: base, desconto: 0 };

  const tipo = String(cupom.tipoDesconto || "").toUpperCase();
  const valor = Number(cupom.valor || 0);

  if (tipo === "PERCENTUAL") {
    const pct = Math.min(100, Math.max(0, valor));
    const desconto = round2(base * (pct / 100));
    const final = round2(clampMin0(base - desconto));
    return { final, desconto };
  }

  if (tipo === "VALOR_FIXO") {
    const desconto = round2(Math.min(base, Math.max(0, valor)));
    const final = round2(clampMin0(base - desconto));
    return { final, desconto };
  }

  return { final: base, desconto: 0 };
}
function parseISO(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function normalizeKeyFromDep(dep) {
  const cpf = String(dep?.cpf || dep?.cpfTitular || "").replace(/\D/g, "");
  if (cpf) return `cpf:${cpf}`;
  const nome = String(dep?.nome || "").trim().toUpperCase();
  const dn = String(dep?.data_nascimento || dep?.dataNascimento || "").trim();
  const isTit = dep?.isTitular ? "T" : "D";
  return `nd:${isTit}:${nome}:${dn}`;
}
function isTitularLike(dep) {
  if (dep?.isTitular) return true;
  const p = String(dep?.parentesco || "").trim().toUpperCase();
  return p === "TITULAR";
}
function cupomTipoLabel(cupom) {
  const tipo = String(cupom?.tipoDesconto || "").toUpperCase();
  if (tipo === "PERCENTUAL") return "Percentual";
  if (tipo === "VALOR_FIXO") return "Valor fixo";
  return "—";
}
function cupomValorLabel(cupom) {
  const tipo = String(cupom?.tipoDesconto || "").toUpperCase();
  const valor = Number(cupom?.valor || 0);
  if (tipo === "PERCENTUAL") return `${Math.min(100, Math.max(0, valor))}%`;
  if (tipo === "VALOR_FIXO") return money(Math.max(0, valor));
  return "—";
}
function safePad2(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v <= 0) return "00";
  return String(v).padStart(2, "0");
}

export default function StepCarne({
  glassCardStyle, // mantido por compatibilidade
  diaDSelecionado,
  setDiaDSelecionado,
  dataEfetivacaoISO,
  valorMensalidadePlano,
  composicaoMensalidade,
  cobrancasPreview,
  onBack,
  onFinalizar,
  saving,
  onCupomApplied,
  onCupomRemoved,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Cupom
  const [cupomInput, setCupomInput] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomError, setCupomError] = useState("");
  const [cupomInfo, setCupomInfo] = useState(null);

  // UX: lista de cobranças colapsada por padrão
  const [mostrarTodasCobrancas, setMostrarTodasCobrancas] = useState(false);

  useEffect(() => {
    // ao recalcular lista (ex.: troca de plano), resetar o expand
    setMostrarTodasCobrancas(false);
  }, [cobrancasPreview?.length]);

  const totalParcelas = cobrancasPreview?.length || 0;

  const validarCupom = (data) => {
    if (!data) return "Cupom inválido.";
    if (!data.ativo) return "Cupom inativo.";
    const exp = parseISO(data.dataValidade);
    if (exp && exp.getTime() < Date.now()) return "Cupom expirado.";
    const tipo = String(data.tipoDesconto || "").toUpperCase();
    if (tipo !== "PERCENTUAL" && tipo !== "VALOR_FIXO") return "Tipo de desconto não suportado.";

    const qtd = Number(data.quantidadeParcelas || 0);
    if (data.adesao) return null; // cupom só de adesão
    if (qtd <= 0) return "Quantidade de parcelas do cupom inválida.";
    return null;
  };

  const aplicarCupom = async () => {
    if (saving || cupomLoading) return;

    const codigo = String(cupomInput || "").trim().toUpperCase();
    if (!codigo) {
      setCupomError("Informe um cupom.");
      return;
    }

    setCupomError("");
    setCupomLoading(true);
    try {
      const { data } = await api.get(`/api/v1/cupons/${encodeURIComponent(codigo)}`);

      const err = validarCupom(data);
      if (err) {
        setCupomInfo(null);
        setCupomError(err);
        return;
      }

      setCupomInfo(data);
      if (typeof onCupomApplied === "function") onCupomApplied(data);
    } catch (e) {
      setCupomInfo(null);
      const msg =
        e?.response?.status === 404
          ? "Cupom não encontrado."
          : e?.response?.data?.message || "Não foi possível validar o cupom. Tente novamente.";
      setCupomError(msg);
    } finally {
      setCupomLoading(false);
    }
  };

  const removerCupom = () => {
    setCupomInfo(null);
    setCupomError("");
    setCupomInput("");
    if (typeof onCupomRemoved === "function") onCupomRemoved();
  };

  // Cobranças com desconto (regra correta: adesão vs mensalidades)
  const cobrancasComDesconto = useMemo(() => {
    const list = Array.isArray(cobrancasPreview) ? cobrancasPreview : [];

    if (!cupomInfo) {
      return list.map((c) => ({
        ...c,
        _valorOriginal: Number(c?.valor || 0),
        _desconto: 0,
        _cupomAplicado: false,
      }));
    }

    const isAdesaoCupom = !!cupomInfo.adesao;
    const qtd = Number(cupomInfo.quantidadeParcelas || 0);

    const mensalidadesIdx = list
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) => c?.id !== "adesao")
      .map(({ idx }) => idx);

    const idxAplicar = new Set();

    if (isAdesaoCupom) {
      const idxAdesao = list.findIndex((c) => c?.id === "adesao");
      if (idxAdesao >= 0) idxAplicar.add(idxAdesao);
    } else {
      mensalidadesIdx.slice(0, Math.max(0, qtd)).forEach((idx) => idxAplicar.add(idx));
    }

    return list.map((c, idx) => {
      const original = Number(c?.valor || 0);
      if (!idxAplicar.has(idx)) {
        return {
          ...c,
          _valorOriginal: original,
          _desconto: 0,
          _cupomAplicado: false,
        };
      }
      const { final, desconto } = applyDiscountToValue(original, cupomInfo);
      return {
        ...c,
        valor: final,
        _valorOriginal: original,
        _desconto: desconto,
        _cupomAplicado: true,
      };
    });
  }, [cobrancasPreview, cupomInfo]);

  const totalDesconto = useMemo(() => {
    return (cobrancasComDesconto || []).reduce((acc, c) => acc + Number(c?._desconto || 0), 0);
  }, [cobrancasComDesconto]);

  const temDesconto = totalDesconto > 0;

  // Primeira cobrança “real”: primeira parcela com valor > 0 (se adesão ficou 100% off, pula)
  const primeiraCobrancaReal = useMemo(() => {
    const list = Array.isArray(cobrancasComDesconto) ? cobrancasComDesconto : [];
    return list.find((c) => Number(c?.valor || 0) > 0) || null;
  }, [cobrancasComDesconto]);

  const adesaoZerouPorCupom = useMemo(() => {
    const list = Array.isArray(cobrancasComDesconto) ? cobrancasComDesconto : [];
    const ad = list.find((c) => c?.id === "adesao");
    if (!ad) return false;
    return Number(ad?._valorOriginal || 0) > 0 && Number(ad?.valor || 0) === 0;
  }, [cobrancasComDesconto]);

  // >>> REGRA DE ENVIO: não enviar cobranças com valor <= 5
  const cobrancasParaEnvio = useMemo(() => {
    return (cobrancasComDesconto || []).filter((c) => Number(c?.valor || 0) > 5);
  }, [cobrancasComDesconto]);

  const cupomDetalhes = useMemo(() => {
    if (!cupomInfo) return null;

    const isAdesao = !!cupomInfo.adesao;
    const qtd = Number(cupomInfo.quantidadeParcelas || 0);
    const validade = cupomInfo.dataValidade ? parseISO(cupomInfo.dataValidade) : null;

    const alvoLabel = isAdesao
      ? "Aplica somente na adesão"
      : qtd > 0
      ? `Aplica nas ${qtd} primeira${qtd === 1 ? "" : "s"} mensalidade${qtd === 1 ? "" : "s"}`
      : "Aplica nas mensalidades";

    return {
      codigo: String(cupomInfo.codigo || "").toUpperCase(),
      descricao: cupomInfo.descricaoFormatada || cupomInfo.descricao || "Cupom aplicado.",
      tipo: cupomTipoLabel(cupomInfo),
      valor: cupomValorLabel(cupomInfo),
      alvoLabel,
      validadeLabel: validade ? formatDateBR(validade.toISOString()) : null,
    };
  }, [cupomInfo]);

  const handleConfirmarEnvio = () => {
    if (typeof onFinalizar === "function") {
      setConfirmOpen(false);
      onFinalizar({ cobrancas: cobrancasParaEnvio });
    }
  };

  /* ---------------- dados p/ composição mensalidade (mantida) ---------------- */
  const basePlano = composicaoMensalidade?.basePlano || 0;
  const dependentesComposicaoRaw =
    composicaoMensalidade?.dependentes && Array.isArray(composicaoMensalidade.dependentes)
      ? composicaoMensalidade.dependentes
      : [];

  const dependentesComposicao = useMemo(() => {
    const list = dependentesComposicaoRaw;
    const hasExplicitTitular = list.some((d) => d?.isTitular === true);
    const out = [];
    const seen = new Set();

    for (const d of list) {
      if (hasExplicitTitular && !d?.isTitular && isTitularLike(d)) continue;
      const k = normalizeKeyFromDep(d);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(d);
    }
    out.sort((a, b) => Number(!!b?.isTitular) - Number(!!a?.isTitular));
    return out;
  }, [dependentesComposicaoRaw]);

  const MAX_LINHAS = 6;
  const mostrar = dependentesComposicao.slice(0, MAX_LINHAS);
  const restantes = dependentesComposicao.length - mostrar.length;

  /* ---------------- agrupamento + lista “banco” ---------------- */
  const cobrancasAgrupadas = useMemo(() => {
    const list = Array.isArray(cobrancasComDesconto) ? cobrancasComDesconto : [];
    const adesao = list.find((c) => c?.id === "adesao") || null;
    const mensalidades = list.filter((c) => c?.id !== "adesao");
    return { adesao, mensalidades, list };
  }, [cobrancasComDesconto]);

  const cobrancasResumo = useMemo(() => {
    const { adesao, mensalidades } = cobrancasAgrupadas;

    // “3 linhas” por padrão:
    // 1) adesão (se existir)
    // 2) primeira cobrança real
    // 3) próxima mensalidade após a primeira (se existir e for diferente)
    const out = [];
    const pushIf = (c) => {
      if (!c) return;
      if (out.some((x) => x?.id === c?.id)) return;
      out.push(c);
    };

    pushIf(adesao);

    pushIf(primeiraCobrancaReal);

    if (primeiraCobrancaReal) {
      const idx = mensalidades.findIndex((m) => m?.id === primeiraCobrancaReal?.id);
      if (idx >= 0 && mensalidades[idx + 1]) pushIf(mensalidades[idx + 1]);
    }

    // fallback se lista vier diferente
    if (out.length < 3) {
      (mensalidades || []).slice(0, 3 - out.length).forEach((m) => pushIf(m));
    }

    return out.filter(Boolean);
  }, [cobrancasAgrupadas, primeiraCobrancaReal]);

  const totalMensalidades = cobrancasAgrupadas.mensalidades.length;

  /* ---------------- modal premium (recibo, legível) ---------------- */
  const confirmModal =
    confirmOpen && !saving
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* overlay */}
            <div
              className="absolute inset-0 bg-black/55"
              onClick={() => setConfirmOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-0 backdrop-blur-[6px]" aria-hidden="true" />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Finalizar contratação"
              className="relative w-full max-w-xl mx-4 rounded-[28px] border shadow-[0_40px_120px_rgba(0,0,0,0.55)] overflow-hidden"
              style={{
                background: "color-mix(in srgb, var(--surface) 92%, var(--text) 6%)",
                borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
              }}
            >
              {/* header */}
              <div
                className="px-5 md:px-6 pt-5 md:pt-6 pb-4"
                style={{
                  background:
                    "radial-gradient(140% 160% at 80% 0%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 65%)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Revisão final
                    </p>
                    <h3 className="mt-1 text-[18px] md:text-[20px] font-semibold tracking-tight text-[var(--text)]">
                      Confirmar contratação
                    </h3>
                    <p className="mt-1 text-xs md:text-sm leading-relaxed text-[var(--text-muted)]">
                      A ativação ocorre após o primeiro pagamento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium hover:opacity-90"
                    style={{
                      borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
                      color: "var(--text)",
                      background: "color-mix(in srgb, var(--surface) 90%, transparent)",
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </div>

              {/* body */}
              <div className="px-5 md:px-6 pb-5 md:pb-6">
                <div className="grid gap-3">
                  {/* Mensalidade (âncora) */}
                  <div
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      background: "color-mix(in srgb, var(--surface-elevated) 92%, var(--text) 4%)",
                      borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Mensalidade
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--text)]">
                      {money(valorMensalidadePlano)}
                      <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">/ mês</span>
                    </p>
                  </div>

                  {/* Primeiro pagamento real */}
                  <div
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      background: "color-mix(in srgb, var(--surface-elevated) 92%, var(--text) 4%)",
                      borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Primeiro pagamento
                        </p>
                        <p className="mt-1 text-xs md:text-sm text-[var(--text-muted)]">
                          Vencimento{" "}
                          <span className="font-medium tabular-nums text-[var(--text)]">
                            {primeiraCobrancaReal
                              ? formatDateBR(primeiraCobrancaReal.dataVencimentoISO)
                              : formatDateBR(dataEfetivacaoISO)}
                          </span>
                        </p>

                        {adesaoZerouPorCupom ? (
                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            A adesão foi coberta integralmente. O primeiro pagamento exibido já é a próxima parcela paga.
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-semibold tabular-nums text-[var(--text)]">
                          {money(primeiraCobrancaReal?.valor || 0)}
                        </p>

                        {primeiraCobrancaReal && Number(primeiraCobrancaReal?._desconto || 0) > 0 ? (
                          <p className="mt-0.5 text-[11px] tabular-nums text-[var(--text-muted)] line-through">
                            {money(primeiraCobrancaReal._valorOriginal || 0)}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {primeiraCobrancaReal?.id === "adesao" ? "Adesão" : "Mensalidade"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Economia */}
                    {temDesconto ? (
                      <div
                        className="mt-3 rounded-xl border px-3 py-2"
                        style={{
                          background: "color-mix(in srgb, var(--primary) 8%, var(--surface) 92%)",
                          borderColor: "color-mix(in srgb, var(--primary) 24%, transparent)",
                        }}
                      >
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Economia aplicada
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text)]">
                          {money(totalDesconto)}
                        </p>
                        {cupomDetalhes?.codigo ? (
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            Cupom <span className="font-semibold text-[var(--text)]">{cupomDetalhes.codigo}</span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Cupom detalhado (sem ícones) */}
                  {cupomDetalhes ? (
                    <div
                      className="rounded-2xl border px-4 py-3"
                      style={{
                        background: "color-mix(in srgb, var(--surface-elevated) 92%, var(--text) 4%)",
                        borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                      }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        Cupom aplicado
                      </p>

                      <div className="mt-2 grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--text)]">{cupomDetalhes.codigo}</p>
                          <p className="text-sm font-semibold tabular-nums text-[var(--text)]">{cupomDetalhes.valor}</p>
                        </div>

                        <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
                          {cupomDetalhes.descricao}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                          {[
                            { k: "Tipo", v: cupomDetalhes.tipo },
                            { k: "Aplicação", v: cupomDetalhes.alvoLabel },
                            { k: "Validade", v: cupomDetalhes.validadeLabel || "—" },
                          ].map((it) => (
                            <div
                              key={it.k}
                              className="rounded-xl border px-3 py-2"
                              style={{
                                background: "color-mix(in srgb, var(--surface) 94%, var(--text) 3%)",
                                borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                              }}
                            >
                              <p className="text-[11px] text-[var(--text-muted)]">{it.k}</p>
                              <p className="text-xs font-semibold text-[var(--text)]">{it.v}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                          O desconto não altera as parcelas não contempladas.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Resumo */}
                  <div
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
                      borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Resumo</p>
                    <div className="mt-2 grid gap-1 text-xs md:text-sm text-[var(--text)]">
                      <p>
                        • {totalParcelas} parcela{totalParcelas === 1 ? "" : "s"} programada{totalParcelas === 1 ? "" : "s"}
                      </p>
                      <p>
                        • Vencimento todo dia{" "}
                        <span className="font-semibold tabular-nums">{safePad2(diaDSelecionado)}</span>
                      </p>
                      <p className="text-[var(--text-muted)]">• Mantenha esta página aberta até concluir a geração do carnê.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col md:flex-row md:justify-between gap-3">
                  <CTAButton
                    type="button"
                    variant="outline"
                    className="h-11 px-5 rounded-2xl order-2 md:order-1"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Revisar
                  </CTAButton>

                  <CTAButton
                    type="button"
                    className="h-11 px-6 rounded-2xl order-1 md:order-2"
                    onClick={handleConfirmarEnvio}
                  >
                    Confirmar e gerar carnê
                  </CTAButton>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  /* ---------- overlay de processamento ---------- */
  const savingOverlay = saving
    ? createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/55" aria-hidden="true" />
          <div className="absolute inset-0 backdrop-blur-[6px]" aria-hidden="true" />

          <div
            className="relative w-full max-w-sm mx-4 rounded-3xl border px-6 py-5 shadow-[0_28px_90px_rgba(0,0,0,0.75)]"
            style={{
              background: "color-mix(in srgb, var(--surface) 92%, var(--text) 6%)",
              borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ background: "color-mix(in srgb, var(--primary) 28%, black 40%)" }}
              >
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--text)]">Finalizando…</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Registrando contrato e gerando carnê com segurança.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-1.5 w-full rounded-full bg-[var(--c-border)]/40 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-[color-mix(in_srgb,_var(--primary)_85%,_transparent)] animate-pulse" />
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">Não feche esta página.</p>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  /* ---------------- UI ---------------- */
  return (
    <>
      <div className="mt-6">
        <div
          className="relative overflow-hidden rounded-3xl border shadow-xl p-6 md:p-8"
          style={{
            background: "color-mix(in srgb, var(--surface) 88%, var(--text) 6%)",
            borderColor: "color-mix(in srgb, var(--text) 18%, transparent)",
          }}
        >
          {/* gradiente inferior suave */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
            style={{
              background:
                "radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)",
              opacity: 0.65,
            }}
          />

          <fieldset className="relative z-[1] space-y-5" disabled={saving}>
            {/* Cabeçalho interno */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs md:text-sm font-semibold tracking-wide uppercase">
                  Etapa 4 de 4 · Cobranças
                </p>

                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] md:text-xs"
                  style={{
                    background: "color-mix(in srgb, var(--surface-elevated) 90%, transparent)",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--primary)" }}
                  />
                  Revisão
                </span>
              </div>

              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{
                  background: "color-mix(in srgb, var(--surface-elevated) 80%, var(--text) 6%)",
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: "100%", background: "var(--primary)" }}
                />
              </div>

              <p className="text-xs md:text-sm" style={{ color: "var(--text-muted)" }}>
                Escolha o dia do vencimento, aplique cupom (se tiver) e gere o carnê.
              </p>
            </div>

            {/* CUPOM */}
            <div
              className="rounded-2xl border px-4 py-4 md:px-5 md:py-5 space-y-3"
              style={{
                background: "color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)",
                borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-[0.16em]">
                    Cupom de desconto
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Se tiver um cupom, aplicamos e recalculamos as parcelas desta etapa.
                  </p>
                </div>

                {cupomInfo ? (
                  <button
                    type="button"
                    onClick={removerCupom}
                    disabled={saving || cupomLoading}
                    className="text-xs font-medium underline underline-offset-4 text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-40"
                    title="Remover cupom"
                  >
                    Remover
                  </button>
                ) : null}
              </div>

              {!cupomInfo ? (
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <input
                    className="input h-12 text-base bg-white"
                    placeholder="Digite o código do cupom"
                    value={cupomInput}
                    onChange={(e) => setCupomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") aplicarCupom();
                    }}
                    disabled={saving || cupomLoading}
                    autoComplete="off"
                  />

                  <CTAButton
                    type="button"
                    className="h-12 px-6 rounded-2xl"
                    onClick={aplicarCupom}
                    disabled={saving || cupomLoading}
                  >
                    {cupomLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        Validando…
                      </span>
                    ) : (
                      "Aplicar cupom"
                    )}
                  </CTAButton>
                </div>
              ) : (
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
                    borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-[var(--text)]">{cupomDetalhes?.codigo}</p>
                      <p className="text-[11px] mt-0.5 text-[var(--text-muted)] leading-relaxed">
                        {cupomDetalhes?.descricao}
                      </p>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { k: "Tipo", v: cupomDetalhes?.tipo },
                          { k: "Valor", v: cupomDetalhes?.valor },
                          { k: "Aplicação", v: cupomDetalhes?.alvoLabel },
                        ].map((it) => (
                          <div
                            key={it.k}
                            className="rounded-xl border px-3 py-2"
                            style={{
                              background: "color-mix(in srgb, var(--surface) 94%, var(--text) 3%)",
                              borderColor: "color-mix(in srgb, var(--text) 14%, transparent)",
                            }}
                          >
                            <p className="text-[11px] text-[var(--text-muted)]">{it.k}</p>
                            <p className="text-xs font-semibold text-[var(--text)]">{it.v || "—"}</p>
                          </div>
                        ))}
                      </div>

                      {cupomDetalhes?.validadeLabel ? (
                        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                          Validade: <span className="font-semibold">{cupomDetalhes.validadeLabel}</span>
                        </p>
                      ) : null}

                      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                        O desconto não altera as parcelas não contempladas.
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-[var(--text-muted)]">Economia total</p>
                      <p className="text-sm font-semibold tabular-nums text-[var(--text)]">
                        {temDesconto ? money(totalDesconto) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {cupomError ? (
                <p className="text-xs text-red-600" role="alert" aria-live="polite">
                  {cupomError}
                </p>
              ) : null}
            </div>

            {/* DIA DO VENCIMENTO */}
            <div
              className="rounded-2xl border px-4 py-4 md:px-5 md:py-5 space-y-2"
              style={{
                background: "color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)",
                borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
              }}
            >
              <label className="label font-medium text-sm md:text-base" htmlFor="diaD">
                Dia do vencimento
              </label>

              <select
                id="diaD"
                className="input h-12 text-base bg-white"
                value={diaDSelecionado}
                onChange={(e) => setDiaDSelecionado(Number(e.target.value))}
                disabled={saving}
              >
                {DIA_D_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <p className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
                As parcelas seguintes vencem sempre no <b>dia {diaDSelecionado}</b>.
              </p>
            </div>

            {/* TRANSPARÊNCIA DO VALOR (compacto) */}
            {composicaoMensalidade ? (
              <details
                className="group rounded-2xl border border-dashed px-4 py-4 md:px-5 md:py-5"
                style={{
                  background: "color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)",
                  borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                }}
              >
                <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)] mb-0.5">
                      Transparência do valor
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Ver composição do valor por pessoa.</p>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] group-open:opacity-60">
                    {`${""}`}
                    Expandir
                  </span>
                </summary>

                <div className="mt-4 space-y-2">
                  {basePlano > 0 ? (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[var(--text-muted)]">Base do plano</span>
                      <span className="font-semibold tabular-nums">{money(basePlano)}</span>
                    </div>
                  ) : null}

                  {mostrar.length > 0 ? (
                    <div className="mt-1 space-y-1.5">
                      {mostrar.map((dep, idx) => {
                        const parentescoLabel = dep.isTitular
                          ? "Titular"
                          : PARENTESCO_LABELS[dep.parentesco] || dep.parentesco || "Dependente";

                        const idadeTxt =
                          dep.idade != null ? `${dep.idade} ano${dep.idade === 1 ? "" : "s"}` : "idade não informada";

                        const nome = dep.nome || (dep.isTitular ? "Titular" : "Dependente");
                        const isIsento = dep.isento && (dep.valorTotalPessoa || 0) === 0;

                        return (
                          <div
                            key={`${normalizeKeyFromDep(dep)}:${idx}`}
                            className="flex items-center justify-between gap-3 text-[11px]"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{nome}</p>
                              <p className="text-[var(--text-muted)] truncate">
                                {parentescoLabel} • {idadeTxt}
                              </p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              {isIsento ? (
                                <span className="text-[var(--text-muted)]">Isento</span>
                              ) : (
                                <span className="font-semibold tabular-nums">{money(dep.valorTotalPessoa || 0)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {restantes > 0 ? (
                        <p className="text-[11px] text-[var(--text-muted)]">
                          + {restantes} {restantes === 1 ? "pessoa" : "pessoas"} seguindo a mesma regra.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}

            {/* COBRANÇAS PREVISTAS (colapsado por padrão) */}
            <div
              className="rounded-2xl border px-4 py-4 md:px-5 md:py-5"
              style={{
                background: "color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)",
                borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-[0.16em]">
                    Cobranças previstas
                  </p>
                  {totalParcelas > 0 ? (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Confira valores e datas. Você confirma tudo ao finalizar.
                    </p>
                  ) : null}
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-[var(--text-muted)]">Parcelas</p>
                  <p className="text-sm font-semibold tabular-nums">{totalParcelas}x</p>
                </div>
              </div>

              {(!cobrancasPreview || cobrancasPreview.length === 0) ? (
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  As cobranças serão calculadas automaticamente conforme o plano.
                </p>
              ) : null}

              {cobrancasComDesconto && cobrancasComDesconto.length > 0 ? (
                <>
                  {/* Lista inteligente */}
                  <div className="mt-4 space-y-2">
                    {!mostrarTodasCobrancas ? (
                      <>
                        {cobrancasResumo.map((cob, idx) => (
                          <CobrancaRow key={cob.id} cob={cob} index={idx} isCompact />
                        ))}

                        <div className="pt-1">
                          <button
                            type="button"
                            className="w-full rounded-2xl border px-3.5 py-3 text-left hover:opacity-90 transition"
                            style={{
                              background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
                              borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                              color: "var(--text)",
                            }}
                            onClick={() => setMostrarTodasCobrancas(true)}
                          >
                            <p className="text-xs font-semibold">Ver todas as cobranças</p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              Adesão{cobrancasAgrupadas.adesao ? "" : " (sem)"} • Mensalidades {totalMensalidades}x
                            </p>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Adesão */}
                        {cobrancasAgrupadas.adesao ? (
                          <div className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)] px-1">
                              Adesão
                            </p>
                            <CobrancaRow cob={cobrancasAgrupadas.adesao} index={0} />
                          </div>
                        ) : null}

                        {/* Mensalidades */}
                        {cobrancasAgrupadas.mensalidades?.length ? (
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center justify-between px-1">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                Mensalidades
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                                {totalMensalidades}x
                              </p>
                            </div>

                            {cobrancasAgrupadas.mensalidades.map((cob, idx) => (
                              <CobrancaRow
                                key={cob.id}
                                cob={cob}
                                index={(cobrancasAgrupadas.adesao ? 1 : 0) + idx}
                              />
                            ))}
                          </div>
                        ) : null}

                        <div className="pt-1 flex justify-between gap-2">
                          <button
                            type="button"
                            className="flex-1 rounded-2xl border px-3.5 py-3 text-sm font-semibold hover:opacity-90 transition"
                            style={{
                              background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
                              borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                              color: "var(--text)",
                            }}
                            onClick={() => setMostrarTodasCobrancas(false)}
                          >
                            Ocultar detalhes
                          </button>

                          <button
                            type="button"
                            className="flex-1 rounded-2xl border px-3.5 py-3 text-sm font-semibold hover:opacity-90 transition"
                            style={{
                              background: "color-mix(in srgb, var(--primary) 10%, var(--surface) 90%)",
                              borderColor: "color-mix(in srgb, var(--primary) 28%, transparent)",
                              color: "var(--text)",
                            }}
                            onClick={() => setConfirmOpen(true)}
                          >
                            Revisar agora
                          </button>
                        </div>
                      </>
                    )}

                    <div
                      className="mt-2 rounded-2xl border px-3.5 py-3"
                      style={{
                        background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
                        borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
                      }}
                    >
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Plano ativo após o primeiro pagamento.
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Espaço para barra fixa não cobrir conteúdo */}
            <div className="h-20 md:h-0" aria-hidden="true" />

            {/* Navegação tradicional (desktop / fallback) */}
            <div className="hidden md:flex justify-between gap-3 pt-1">
              <CTAButton
                type="button"
                variant="outline"
                className="h-12 px-5 rounded-2xl"
                onClick={onBack}
                disabled={saving}
              >
                Voltar
              </CTAButton>

              <CTAButton
                type="button"
                className="h-12 px-6 rounded-2xl"
                onClick={() => setConfirmOpen(true)}
                disabled={saving}
              >
                Revisar e finalizar
              </CTAButton>
            </div>
          </fieldset>

          {/* Barra fixa (mobile e também útil em telas longas) */}
          <div className="md:hidden">
            <div
              className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4"
              style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
            >
              <div
                className="rounded-3xl border shadow-[0_22px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl px-4 py-3"
                style={{
                  background: "color-mix(in srgb, var(--c-surface) 82%, transparent)",
                  borderColor: "color-mix(in srgb, var(--c-border) 70%, transparent)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--c-muted)]">
                      Primeiro pagamento
                    </p>
                    <p className="text-base font-semibold tabular-nums truncate">
                      {money(primeiraCobrancaReal?.valor || 0)}
                      <span className="ml-2 text-[11px] font-normal text-[var(--c-muted)] tabular-nums">
                        {primeiraCobrancaReal
                          ? formatDateBR(primeiraCobrancaReal.dataVencimentoISO)
                          : formatDateBR(dataEfetivacaoISO)}
                      </span>
                    </p>
                    {temDesconto ? (
                      <p className="text-[11px] text-[var(--c-muted)]">
                        Economia: <span className="font-semibold tabular-nums">{money(totalDesconto)}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-[var(--c-muted)]">Mensalidade: {money(valorMensalidadePlano)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <CTAButton
                      type="button"
                      variant="outline"
                      className="h-11 px-4 rounded-2xl"
                      onClick={onBack}
                      disabled={saving}
                    >
                      Voltar
                    </CTAButton>

                    <CTAButton
                      type="button"
                      className="h-11 px-5 rounded-2xl"
                      onClick={() => setConfirmOpen(true)}
                      disabled={saving}
                    >
                      Revisar
                    </CTAButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmModal}
      {savingOverlay}
    </>
  );
}

/* ---------------- subcomponent: row (sem ícones) ---------------- */
function CobrancaRow({ cob, index, isCompact = false }) {
  const isAdesao = cob?.id === "adesao";
  const teveDesconto = !!cob?._cupomAplicado && Number(cob?._desconto || 0) > 0;

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3"
      style={{
        background: "color-mix(in srgb, var(--surface) 92%, var(--text) 4%)",
        borderColor: "color-mix(in srgb, var(--text) 16%, transparent)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
          style={{
            background: isAdesao
              ? "color-mix(in srgb, var(--primary) 14%, white)"
              : "color-mix(in srgb, var(--surface) 94%, var(--text) 2%)",
            color: isAdesao ? "var(--primary)" : "var(--text-muted)",
            border: isAdesao
              ? "1px solid transparent"
              : "1px solid color-mix(in srgb, var(--text) 14%, transparent)",
          }}
        >
          {index + 1}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-medium truncate text-[var(--text)]">
            {cob?.tipo || (isAdesao ? "Taxa de adesão" : "Mensalidade")}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Vencimento <span className="tabular-nums">{formatDateBR(cob?.dataVencimentoISO)}</span>
          </p>

          {!isCompact && teveDesconto ? (
            <p className="text-[11px] text-[var(--text-muted)]">
              Desconto{" "}
              <span className="font-semibold tabular-nums text-[var(--text)]">
                {money(cob?._desconto)}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end text-right">
        <p className="text-sm font-semibold tabular-nums text-[var(--text)]">{money(cob?.valor || 0)}</p>

        {teveDesconto ? (
          <p className="text-[11px] text-[var(--text-muted)] tabular-nums line-through">
            {money(cob?._valorOriginal || 0)}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--text-muted)]">
            Parcela {index + 1}
            {isAdesao ? " • Adesão" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
