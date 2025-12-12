// src/pages/cadastro/StepCarne.jsx
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CTAButton from "@/components/ui/CTAButton";
import { DIA_D_OPTIONS, PARENTESCO_LABELS } from "@/lib/constants";
import { money } from "@/lib/planUtils";
import { formatDateBR } from "@/lib/br";
import api from "@/lib/api.js";
import { Loader2, ShieldCheck, CalendarDays, Tag, X } from "lucide-react";

function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base md:text-lg font-semibold tracking-tight">
        {children}
      </h2>
      {right}
    </div>
  );
}

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

export default function StepCarne({
  glassCardStyle,
  diaDSelecionado,
  setDiaDSelecionado,
  dataEfetivacaoISO,
  valorMensalidadePlano,
  composicaoMensalidade,
  cobrancasPreview,
  onBack,
  onFinalizar,
  saving,

  // (opcionais) para o pai “enxergar” o cupom aplicado sem quebrar o fluxo atual:
  onCupomApplied,
  onCupomRemoved,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Cupom
  const [cupomInput, setCupomInput] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomError, setCupomError] = useState("");
  const [cupomInfo, setCupomInfo] = useState(null);

  const totalParcelas = cobrancasPreview?.length || 0;
  const primeiraCobranca = cobrancasPreview?.[0] || null;

  const handleClickFinalizar = () => {
    if (saving) return;
    setConfirmOpen(true);
  };

  const validarCupom = (data) => {
    if (!data) return "Cupom inválido.";
    if (!data.ativo) return "Cupom inativo.";
    const exp = parseISO(data.dataValidade);
    if (exp && exp.getTime() < Date.now()) return "Cupom expirado.";
    const tipo = String(data.tipoDesconto || "").toUpperCase();
    if (tipo !== "PERCENTUAL" && tipo !== "VALOR_FIXO")
      return "Tipo de desconto não suportado.";
    const qtd = Number(data.quantidadeParcelas || 0);
    if (data.adesao) {
      // ok: desconto de adesão costuma ser 1 parcela
      return null;
    }
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
      const { data } = await api.get(
        `/api/v1/cupons/${encodeURIComponent(codigo)}`
      );

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
          : e?.response?.data?.message ||
            "Não foi possível validar o cupom. Tente novamente.";
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

  // Cobranças com desconto (apenas visual nesta etapa)
  const cobrancasComDesconto = useMemo(() => {
    const list = Array.isArray(cobrancasPreview) ? cobrancasPreview : [];
    if (!cupomInfo)
      return list.map((c) => ({
        ...c,
        _valorOriginal: c.valor,
        _desconto: 0,
        _cupomAplicado: false,
      }));

    const isAdesaoCupom = !!cupomInfo.adesao;
    const qtd = Number(cupomInfo.quantidadeParcelas || 0);

    // Índices de mensalidades (exclui adesão)
    const mensalidadesIdx = list
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) => c?.id !== "adesao")
      .map(({ idx }) => idx);

    const idxAplicar = new Set();

    if (isAdesaoCupom) {
      const idxAdesao = list.findIndex((c) => c?.id === "adesao");
      if (idxAdesao >= 0) idxAplicar.add(idxAdesao);
    } else {
      mensalidadesIdx
        .slice(0, Math.max(0, qtd))
        .forEach((idx) => idxAplicar.add(idx));
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

  const totalComDesconto = useMemo(() => {
    return (cobrancasComDesconto || []).reduce(
      (acc, c) => acc + Number(c?.valor || 0),
      0
    );
  }, [cobrancasComDesconto]);

  const totalDesconto = useMemo(() => {
    return (cobrancasComDesconto || []).reduce(
      (acc, c) => acc + Number(c?._desconto || 0),
      0
    );
  }, [cobrancasComDesconto]);

  // >>> REGRA DE ENVIO: não enviar cobranças com valor <= 5
  const cobrancasParaEnvio = useMemo(() => {
    return (cobrancasComDesconto || []).filter((c) => Number(c?.valor || 0) > 5);
  }, [cobrancasComDesconto]);

  const handleConfirmarEnvio = () => {
    if (typeof onFinalizar === "function") {
      setConfirmOpen(false);
      // Compatível: se o pai ignorar argumento, segue normal.
      onFinalizar({ cobrancas: cobrancasParaEnvio });
    }
  };

  /* ---------- MODAL DE CONFIRMAÇÃO (PORTAL) ---------- */
  const confirmModal =
    confirmOpen && !saving
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45">
            <div
              className="w-full max-w-lg mx-4 rounded-3xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)] p-5 md:p-6"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "var(--c-border)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--c-muted)] mb-1">
                    Confirmação
                  </p>
                  <h3 className="text-base md:text-lg font-semibold tracking-tight">
                    Revise os dados de cobrança
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="text-[var(--c-muted)] text-xs underline underline-offset-4 hover:text-[var(--text)]"
                >
                  Editar depois
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {/* Resumo do carnê */}
                <div
                  className="rounded-2xl border px-3.5 py-3 flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "var(--c-border)",
                  }}
                >
                  <div>
                    <p className="text-[11px] text-[var(--c-muted)] uppercase tracking-[0.16em]">
                      Resumo do carnê
                    </p>
                    <p className="text-sm mt-1">
                      {totalParcelas} parcelas programadas, com início em{" "}
                      <span className="font-semibold tabular-nums">
                        {primeiraCobranca
                          ? formatDateBR(primeiraCobranca.dataVencimentoISO)
                          : formatDateBR(dataEfetivacaoISO)}
                      </span>
                      .
                    </p>

                    {cupomInfo && (
                      <p className="text-[11px] text-[var(--c-muted)] mt-1 leading-relaxed">
                        Cupom aplicado:{" "}
                        <span className="font-semibold">{cupomInfo.codigo}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[var(--c-muted)]">Dia do vencimento</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {String(diaDSelecionado).padStart(2, "0")}
                    </p>
                  </div>
                </div>

                {/* Primeira cobrança */}
                {primeiraCobranca && (
                  <div
                    className="rounded-2xl border px-3.5 py-3 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: "var(--c-border)",
                    }}
                  >
                    <div>
                      <p className="text-[11px] text-[var(--c-muted)] uppercase tracking-[0.16em]">
                        Primeira cobrança
                      </p>
                      <p className="text-xs mt-1 leading-relaxed">
                        {primeiraCobranca.id === "adesao"
                          ? "Taxa de adesão + início da proteção. A efetivação ocorre após o pagamento."
                          : "Início da cobrança recorrente do plano. A efetivação ocorre após o pagamento."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {money(primeiraCobranca.valor || 0)}
                      </p>
                      <p className="text-[11px] text-[var(--c-muted)] tabular-nums">
                        {formatDateBR(primeiraCobranca.dataVencimentoISO)}
                      </p>
                    </div>
                  </div>
                )}

                {!!cupomInfo && totalDesconto > 0 && (
                  <div
                    className="rounded-2xl border px-3.5 py-3 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: "var(--c-border)",
                    }}
                  >
                    <div>
                      <p className="text-[11px] text-[var(--c-muted)] uppercase tracking-[0.16em]">
                        Desconto aplicado
                      </p>
                      <p className="text-xs mt-1 text-[var(--c-muted)]">
                        {cupomInfo.descricaoFormatada || "Cupom aplicado ao carnê."}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        - {money(totalDesconto)}
                      </p>
                      <p className="text-[11px] text-[var(--c-muted)] tabular-nums">
                        Total após desconto: {money(totalComDesconto)}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-[var(--c-muted)] leading-relaxed">
                  Ao confirmar, seu contrato será registrado e o carnê será gerado automaticamente.
                  A proteção do plano será ativada <b>após o pagamento da primeira cobrança</b>.
                </p>
              </div>

              <div className="mt-5 flex flex-col md:flex-row md:justify-between gap-3">
                <CTAButton
                  type="button"
                  variant="outline"
                  className="h-10 px-5 order-2 md:order-1"
                  onClick={() => setConfirmOpen(false)}
                >
                  Voltar e ajustar
                </CTAButton>

                <CTAButton
                  type="button"
                  className="h-10 px-6 order-1 md:order-2"
                  onClick={handleConfirmarEnvio}
                >
                  Confirmar e finalizar
                </CTAButton>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  /* ---------- OVERLAY DE PROCESSAMENTO (PORTAL) ---------- */
  const savingOverlay = saving
    ? createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45">
          <div
            className="w-full max-w-sm mx-4 rounded-3xl border px-6 py-5 shadow-[0_28px_90px_rgba(0,0,0,0.85)]"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "var(--c-border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,_var(--primary)_28%,_black_40%)]">
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">Finalizando sua contratação…</p>
                <p className="text-[11px] text-[var(--c-muted)] mt-0.5">
                  Estamos registrando o contrato e gerando o carnê com segurança.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-1.5 w-full rounded-full bg-[var(--c-border)]/40 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-[color-mix(in_srgb,_var(--primary)_85%,_transparent)] animate-pulse" />
              </div>
              <p className="mt-2 text-[11px] text-[var(--c-muted)]">
                Mantenha esta página aberta. Em instantes você será direcionado para o resumo do contrato.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  /* ----------------- COMPOSIÇÃO DA MENSALIDADE ----------------- */
  const dependentesComposicao =
    composicaoMensalidade?.dependentes &&
    Array.isArray(composicaoMensalidade.dependentes)
      ? composicaoMensalidade.dependentes
      : [];

  const basePlano = composicaoMensalidade?.basePlano || 0;

  const MAX_LINHAS = 6;
  const mostrar = dependentesComposicao.slice(0, MAX_LINHAS);
  const restantes = dependentesComposicao.length - mostrar.length;

  /* -------------------- CONTEÚDO PRINCIPAL DA ETAPA -------------------- */
  return (
    <>
      <div
        className="mt-6 rounded-3xl p-6 md:p-7 relative overflow-hidden"
        style={glassCardStyle}
      >
        {/* Halo discreto de fundo */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-32 -right-10 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,_var(--primary)_0,_transparent_70%)] blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,_var(--primary-muted,_#4b5563)_0,_transparent_70%)] blur-3xl" />
        </div>

        <div className="relative z-10">
          <SectionTitle
            right={
              <div className="hidden md:flex items-center gap-2 text-[11px] text-[var(--c-muted)]">
                <ShieldCheck className="h-4 w-4" />
                <span>Resumo da cobrança</span>
              </div>
            }
          >
            Cobrança (carnê)
          </SectionTitle>

          {/* CUPOM DE DESCONTO */}
          <div className="mt-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[var(--c-muted)] mb-1 uppercase tracking-[0.16em]">
                  Cupom de desconto
                </p>
                <p className="text-xs text-[var(--c-muted)] leading-relaxed">
                  Informe seu cupom e aplique para recalcular os valores do carnê nesta tela.
                </p>
              </div>

              {cupomInfo ? (
                <button
                  type="button"
                  onClick={removerCupom}
                  disabled={saving || cupomLoading}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--c-muted)] hover:text-[var(--text)]"
                  title="Remover cupom"
                >
                  <X size={14} />
                  Remover
                </button>
              ) : null}
            </div>

            {!cupomInfo ? (
              <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    className="input h-11 w-full text-sm pl-10"
                    placeholder="Ex.: ADESAOFREE"
                    value={cupomInput}
                    onChange={(e) => setCupomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") aplicarCupom();
                    }}
                    disabled={saving || cupomLoading}
                    autoComplete="off"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--c-muted)]">
                    <Tag size={16} />
                  </div>
                </div>

                <CTAButton
                  type="button"
                  className="h-11 px-5"
                  onClick={aplicarCupom}
                  disabled={saving || cupomLoading}
                >
                  {cupomLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Validando…
                    </span>
                  ) : (
                    "Aplicar"
                  )}
                </CTAButton>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{cupomInfo.codigo}</p>
                    <p className="text-[11px] text-[var(--c-muted)] leading-relaxed mt-0.5">
                      {cupomInfo.descricaoFormatada || "Cupom aplicado."}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[var(--c-muted)]">Desconto</p>
                    <p className="text-sm font-semibold tabular-nums">
                      - {money(totalDesconto)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {cupomError ? <p className="mt-2 text-xs text-red-600">{cupomError}</p> : null}
          </div>

          {/* Linha com dia D + resumo */}
          <div className="mt-4 grid gap-3 md:grid-cols-3 items-stretch">
            {/* Dia D */}
            <div className="md:col-span-1">
              <label className="label text-xs font-medium" htmlFor="diaD">
                Dia D (vencimento)
              </label>
              <div className="relative">
                <select
                  id="diaD"
                  className="input h-11 w-full text-sm pr-9"
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
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--c-muted)]">
                  <CalendarDays size={16} />
                </div>
              </div>
              <p className="text-xs text-[var(--c-muted)] mt-1 leading-relaxed">
                A primeira cobrança acontece a partir da <b>data de efetivação</b>.
                As demais seguem sempre no <b>dia {diaDSelecionado}</b>.
              </p>
            </div>

            {/* Cards resumo */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[11px] text-[var(--c-muted)] font-medium uppercase tracking-[0.16em]">
                    Mensalidade
                  </p>
                  <p className="font-semibold text-[15px] mt-1 tabular-nums">
                    {money(valorMensalidadePlano)}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-[var(--c-muted)]">
                  Valor recorrente das parcelas, sem considerar reajustes futuros.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[11px] text-[var(--c-muted)] font-medium uppercase tracking-[0.16em]">
                    Total do carnê
                  </p>
                  <p className="font-semibold text-[15px] mt-1 tabular-nums">
                    {money(totalComDesconto)}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-[var(--c-muted)]">
                  Soma das parcelas exibidas abaixo{cupomInfo ? " (com cupom aplicado)" : ""}.
                </p>
              </div>
            </div>
          </div>

          {/* Composição da mensalidade – compacto */}
          {composicaoMensalidade && (
            <div className="mt-4">
              <details className="group rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)]/80 px-3.5 py-3">
                <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--c-muted)] mb-0.5">
                      Composição do valor
                    </p>
                    <p className="text-xs text-[var(--c-muted)]">
                      Veja quanto cada pessoa contribui ou está isenta.
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--c-muted)] group-open:opacity-60">
                    Ver detalhes
                  </span>
                </summary>

                <div className="mt-3 space-y-2">
                  {basePlano > 0 && (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[var(--c-muted)]">
                        Plano base (estrutura e benefícios comuns)
                      </span>
                      <span className="font-semibold tabular-nums">
                        {money(basePlano)}
                      </span>
                    </div>
                  )}

                  {mostrar.length > 0 && (
                    <div className="mt-1 space-y-1.5">
                      {mostrar.map((dep, idx) => {
                        const parentescoLabel = dep.isTitular
                          ? "Titular"
                          : PARENTESCO_LABELS[dep.parentesco] ||
                            dep.parentesco ||
                            "Dependente";
                        const idadeTxt =
                          dep.idade != null
                            ? `${dep.idade} ano${dep.idade === 1 ? "" : "s"}`
                            : "idade não informada";
                        const nome =
                          dep.nome || (dep.isTitular ? "Titular" : "Dependente");

                        const isIsento =
                          dep.isento && (dep.valorTotalPessoa || 0) === 0;

                        return (
                          <div
                            key={`${dep.id || idx}-${dep.parentesco}-${dep.idade || "?"}`}
                            className="flex items-center justify-between gap-3 text-[11px]"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{nome}</p>
                              <p className="text-[var(--c-muted)] truncate">
                                {parentescoLabel} • {idadeTxt}
                              </p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              {isIsento ? (
                                <span className="text-[var(--c-muted)]">Isento</span>
                              ) : (
                                <span className="font-semibold tabular-nums">
                                  {money(dep.valorTotalPessoa || 0)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {restantes > 0 && (
                        <p className="text-[11px] text-[var(--c-muted)]">
                          + {restantes} {restantes === 1 ? "pessoa" : "pessoas"} com as
                          mesmas regras.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Lista de cobranças previstas */}
          <div className="mt-6 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-[var(--c-muted)] mb-1 uppercase tracking-[0.16em]">
                  Cobranças previstas
                </p>
                {totalParcelas > 0 && (
                  <p className="text-xs text-[var(--c-muted)]">
                    {totalParcelas} parcelas programadas. Revise datas e valores antes de finalizar.
                  </p>
                )}
                {cupomInfo ? (
                  <p className="text-[11px] text-[var(--c-muted)] mt-1">
                    Cupom aplicado: <span className="font-semibold">{cupomInfo.codigo}</span>
                  </p>
                ) : null}
              </div>
              {totalParcelas > 0 && (
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--c-muted)]">
                    Primeira cobrança
                  </span>
                  <span className="text-xs font-medium tabular-nums">
                    {primeiraCobranca
                      ? `${formatDateBR(primeiraCobranca.dataVencimentoISO)} • ${money(
                          primeiraCobranca.valor || 0
                        )}`
                      : "—"}
                  </span>
                </div>
              )}
            </div>

            {(!cobrancasPreview || cobrancasPreview.length === 0) && (
              <p className="mt-3 text-sm text-[var(--c-muted)]">
                As cobranças serão calculadas automaticamente conforme as regras do plano.
              </p>
            )}

            {cobrancasComDesconto && cobrancasComDesconto.length > 0 && (
              <div className="mt-4 space-y-2">
                {cobrancasComDesconto.map((cob, index) => {
                  const isAdesao = cob.id === "adesao";
                  const teveDesconto =
                    !!cob._cupomAplicado && Number(cob._desconto || 0) > 0;

                  return (
                    <div
                      key={cob.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-2.5 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                            isAdesao
                              ? "bg-[color-mix(in_srgb,_var(--primary)_16%,_white)] text-[var(--primary)]"
                              : "bg-[var(--c-surface)] text-[var(--c-muted)] border border-[var(--c-border)]"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {cob.tipo || (isAdesao ? "Taxa de adesão" : "Cobrança")}
                          </p>
                          <p className="text-[11px] text-[var(--c-muted)]">
                            Vencimento em{" "}
                            <span className="tabular-nums">
                              {formatDateBR(cob.dataVencimentoISO)}
                            </span>
                          </p>
                          {teveDesconto ? (
                            <p className="text-[11px] text-[var(--c-muted)]">
                              Cupom aplicado • desconto{" "}
                              <span className="font-semibold tabular-nums">
                                {money(cob._desconto)}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-end text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {money(cob.valor || 0)}
                        </p>

                        {teveDesconto ? (
                          <p className="text-[11px] text-[var(--c-muted)] tabular-nums line-through">
                            {money(cob._valorOriginal || 0)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[var(--c-muted)]">
                            Parcela {index + 1}
                            {isAdesao ? " • Adesão" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="mt-6 flex flex-col md:flex-row md:justify-between gap-3">
            <CTAButton
              type="button"
              variant="outline"
              className="h-11 px-5 order-2 md:order-1"
              onClick={onBack}
              disabled={saving}
            >
              Voltar
            </CTAButton>

            <CTAButton
              type="button"
              className="h-11 px-6 order-1 md:order-2"
              onClick={handleClickFinalizar}
              disabled={saving}
              aria-disabled={saving ? "true" : "false"}
            >
              {saving ? "Finalizando…" : "Revisar e finalizar contratação"}
            </CTAButton>
          </div>
        </div>
      </div>

      {/* Portais */}
      {confirmModal}
      {savingOverlay}
    </>
  );
}
