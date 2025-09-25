import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import { money, pick, getMensal } from "@/lib/planUtils.js";
import {
  CheckCircle2,
  ChevronLeft,
  AlertTriangle,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";

/* ===================== Helpers ===================== */
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function decodePayloadParam(p) {
  try { return JSON.parse(decodeURIComponent(atob(p))); }
  catch { try { return JSON.parse(atob(p)); }
  catch { try { return JSON.parse(decodeURIComponent(p)); }
  catch { return null; }}}
}

function onlyDigits(v = "") { return String(v).replace(/\D+/g, ""); }

function cpfIsValid(cpf) {
  cpf = onlyDigits(cpf);
  if (!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i=0;i<9;i++) sum += parseInt(cpf.charAt(i))*(10-i);
  let rev = 11 - (sum % 11); if (rev >= 10) rev = 0; if (rev !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i=0;i<10;i++) sum += parseInt(cpf.charAt(i))*(11-i);
  rev = 11 - (sum % 11); if (rev >= 10) rev = 0;
  return rev === parseInt(cpf.charAt(10));
}

function ageFromDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function openWhatsApp(number, message) {
  const n = number ? onlyDigits(number) : "";
  const text = encodeURIComponent(message || "");
  const url = n ? `https://wa.me/${n}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, "_blank", "noopener");
}

/* ===== Parentescos: fallback completo (usado apenas se a API do plano vier vazia) ===== */
const PARENTESCOS_FALLBACK = [
  ["CONJUGE", "Cônjuge"],
  ["COMPANHEIRO", "Companheiro(a)"],
  ["FILHO", "Filho(a)"],
  ["PAI", "Pai"],
  ["MAE", "Mãe"],
  ["IRMAO", "Irmã(o)"],
  ["AVO", "Avô(ó)"],
  ["TITULAR", "Titular"],
  ["RESPONSAVEL", "Responsável"],
  ["TIO", "Tio(a)"],
  ["SOBRINHO", "Sobrinho(a)"],
  ["PRIMO", "Primo(a)"],
  ["NETO", "Neto(a)"],
  ["BISNETO", "Bisneto(a)"],
  ["PADRASTO", "Padrasto"],
  ["MADRASTRA", "Madrasta"],
  ["AFILHADO", "Afilhado(a)"],
  ["ENTEADA", "Enteado(a)"],
  ["SOGRO", "Sogro(a)"],
  ["GENRO", "Genro"],
  ["NORA", "Nora"],
  ["CUNHADO", "Cunhado(a)"],
  ["BISAVO", "Bisavô(ó)"],
  ["MADRINHA", "Madrinha"],
  ["PADRINHO", "Padrinho"],
  ["AMIGO", "Amigo(a)"],
  ["AGREGADO", "Agregado"],
  ["DEPENDENTE", "Dependente"],
  ["COLABORADOR", "Colaborador"],
  ["EX_CONJUGE", "Ex Cônjuge"],
  ["EX_TITULAR", "Ex Titular"],
  ["EX_RESPONSAVEL", "Ex Responsável"],
];
const PARENTESCO_LABELS = Object.fromEntries(PARENTESCOS_FALLBACK);
const labelParentesco = (v) => PARENTESCO_LABELS[v] || v;

/* ===== Estado civil: valores aceitos pela API ===== */
const ESTADO_CIVIL_OPTIONS = [
  ["SOLTEIRO", "Solteiro(a)"],
  ["CASADO", "Casado(a)"],
  ["DIVORCIADO", "Divorciado(a)"],
  ["AMASIADO", "Amasiado(a)"],
  ["UNIAO_ESTAVEL", "União Estável"],
  ["VIUVO", "Viúvo(a)"],
  ["SEPARADO", "Separado(a)"],
];
const ESTADO_CIVIL_LABEL = Object.fromEntries(ESTADO_CIVIL_OPTIONS);

/* ===================== Página ===================== */
export default function Cadastro() {
  const q = useQuery();
  const navigate = useNavigate();

  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const payload = useMemo(() => decodePayloadParam(q.get("p")), [q]);
  const planoId = payload?.plano;
  const cupom = payload?.cupom || "";

  const [titular, setTitular] = useState({
    nome: "",
    cpf: "",
    rg: "",
    estado_civil: "",
    data_nascimento: "",
    endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" },
  });

  const [deps, setDeps] = useState([]);

  // Carrega plano
  useEffect(() => {
    async function run() {
      try {
        if (planoId) {
          const { data } = await api.get(`/api/v1/planos/${planoId}`);
          setPlano(data);
        }
      } catch (e) {
        console.error(e);
        setError("Falha ao carregar plano.");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [planoId]);

  // Monta dependentes vindos do payload (sem forçar parentesco)
  useEffect(() => {
    if (!payload) return;
    const qtd = Number(payload.qtdDependentes || 0);
    const arr = Array.from({ length: qtd }).map(() => ({
      nome: "",
      parentesco: "",            // sem seleção inicial
      data_nascimento: "",
    }));
    if (Array.isArray(payload.dependentes)) {
      payload.dependentes.forEach((d, i) => {
        if (!arr[i]) arr[i] = { nome: "", parentesco: "", data_nascimento: "" };
        arr[i].parentesco = (d.parentesco ?? "") || arr[i].parentesco;
        arr[i].__idade_hint = d.idade ?? undefined;
        arr[i].nome = d.nome || arr[i].nome;
      });
    }
    setDeps(arr);
  }, [payload]);

  // Parentescos efetivos (plano > fallback)
  const parentescosPlano = pick(plano || {}, "parentescos") || [];
  const PARENTESCOS_EFFECTIVE = useMemo(() => {
    if (Array.isArray(parentescosPlano) && parentescosPlano.length > 0) {
      return parentescosPlano.map((v) => [v, PARENTESCO_LABELS[v] || v]);
    }
    return PARENTESCOS_FALLBACK;
  }, [parentescosPlano]);
  const PARENTESCOS_VALUES = useMemo(
    () => PARENTESCOS_EFFECTIVE.map(([v]) => v),
    [PARENTESCOS_EFFECTIVE]
  );

  const idadeMinTit = pick(plano || {}, "idadeMinimaTitular", "idade_minima_titular");
  const idadeMaxTit = pick(plano || {}, "idadeMaximaTitular", "idade_maxima_titular");
  const idadeMinDep = pick(plano || {}, "idadeMinimaDependente", "idade_minima_dependente");
  const idadeMaxDep = pick(plano || {}, "idadeMaximaDependente", "idade_maxima_dependente");

  const baseMensal = useMemo(() => getMensal(plano), [plano]);
  const numDepsIncl = Number(pick(plano || {}, "numeroDependentes", "numero_dependentes") || 0);
  const valorIncAnual = Number(pick(plano || {}, "valorIncremental", "valor_incremental") || 0);
  const valorIncMensal = useMemo(() => valorIncAnual / 12, [valorIncAnual]);
  const excedentes = Math.max(0, deps.length - numDepsIncl);
  const totalMensal = (baseMensal || 0) + excedentes * valorIncMensal;
  const totalAnual = totalMensal * 12;

  const titularAge = ageFromDate(titular.data_nascimento);
  const titularForaLimite =
    titular.data_nascimento &&
    ((Number.isFinite(idadeMinTit) && titularAge < idadeMinTit) ||
      (Number.isFinite(idadeMaxTit) && titularAge > idadeMaxTit));

  const depsIssues = deps.map((d) => {
    const age = ageFromDate(d.data_nascimento);
    const fora =
      d.data_nascimento &&
      ((Number.isFinite(idadeMinDep) && age < idadeMinDep) ||
        (Number.isFinite(idadeMaxDep) && age > idadeMaxDep));
    return { fora, age };
  });
  const countDepsFora = depsIssues.filter((x) => x.fora).length;

  const updTit = (patch) => setTitular((t) => ({ ...t, ...patch }));
  const updTitEndereco = (patch) =>
    setTitular((t) => ({ ...t, endereco: { ...t.endereco, ...patch } }));

  const updDep = (i, patch) =>
    setDeps((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addDep = () =>
    setDeps((prev) => [
      ...prev,
      { nome: "", parentesco: "", data_nascimento: "" }, // parentesco vazio
    ]);
  const delDep = (i) => setDeps((prev) => prev.filter((_, idx) => idx !== i));

  async function handleSalvarEnviar() {
    setSaving(true);
    setError("");
    try {
      const familiaBody = {
        planoId,
        cupom,
        titular: {
          nome: titular.nome?.trim(),
          cpf: onlyDigits(titular.cpf),
          rg: titular.rg || null,
          estado_civil: titular.estado_civil || null,
          data_nascimento: titular.data_nascimento || null,
          endereco: titular.endereco,
        },
        dependentes: deps.map((d) => ({
          nome: d.nome?.trim() || null,
          parentesco: d.parentesco || null, // envia null se não escolhido
          data_nascimento: d.data_nascimento || null,
        })),
      };
      const famRes = await api.post("/api/v1/familias", familiaBody);
      const familiaId = famRes?.data?.id || famRes?.data?.uuid || famRes?.data?.id_familia;

      const contratoBody = {
        planoId,
        familiaId,
        cupom: cupom || undefined,
        totalMensal,
        totalAnual,
        dependentesInformados: deps.length,
      };
      const orcRes = await api.post("/api/v1/orcamentos/contrato-simplificado", contratoBody);

      navigate(`/confirmacao?familia=${familiaId}&orcamento=${orcRes?.data?.id || ""}`);
    } catch (e) {
      console.error(e);
      setError("Não foi possível concluir pelo site. Você pode enviar por WhatsApp.");
    } finally {
      setSaving(false);
    }
  }

  function sendWhatsFallback() {
    const numero = (import.meta?.env?.VITE_WHATSAPP || window.__WHATSAPP__) || "";
    const linhas = [];
    linhas.push("*Solicitação de Contratação*\n");
    linhas.push(`Plano: ${plano?.nome || planoId}`);
    linhas.push(`Valor base: ${money(baseMensal)} | Total mensal: ${money(totalMensal)}`);
    if (cupom) linhas.push(`Cupom: ${cupom}`);
    linhas.push("\n*Titular*:");
    linhas.push(`Nome: ${titular.nome || ""}`);
    linhas.push(`CPF: ${titular.cpf || ""}`);
    linhas.push(`RG: ${titular.rg || ""}`);
    linhas.push(
      `Estado civil: ${ESTADO_CIVIL_LABEL[titular.estado_civil] || titular.estado_civil || ""}`
    );
    linhas.push(`Nascimento: ${titular.data_nascimento || ""}`);
    const e = titular.endereco || {};
    linhas.push(
      `End.: ${e.logradouro || ""}, ${e.numero || ""} ${e.complemento || ""} - ${e.bairro || ""}`
    );
    linhas.push(`${e.cidade || ""}/${e.uf || ""} - CEP ${e.cep || ""}`);
    linhas.push("\n*Dependentes*:");
    if (!deps.length) linhas.push("(Nenhum)");
    deps.forEach((d, i) =>
      linhas.push(
        `${i + 1}. ${d.nome || "(sem nome)"} - ${labelParentesco(d.parentesco)} - nasc.: ${
          d.data_nascimento || ""
        }`
      )
    );
    openWhatsApp(numero, linhas.join("\n"));
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container-max space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-[var(--c-surface)]" />
          <div className="h-24 rounded-2xl animate-pulse bg-[var(--c-surface)]" />
        </div>
      </section>
    );
  }

  if (!payload || !planoId) {
    return (
      <section className="section">
        <div className="container-max">
          <p className="mb-3 font-medium">Não encontramos os dados da simulação.</p>
          <CTAButton onClick={() => navigate(-1)}>Voltar</CTAButton>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-max">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)]"
          >
            <ChevronLeft size={16} /> Voltar
          </button>
        </div>

        {/* Coluna única (100%) */}
        <div className="space-y-8">
          {/* Formulário */}
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <h1 className="text-2xl font-extrabold tracking-tight">Cadastro</h1>
            <p className="mt-1 text-sm text-[var(--c-muted)]">
              Plano <b>{plano?.nome || ""}</b> — Base mensal {money(baseMensal)}
            </p>

            {/* Titular */}
            <div className="mt-6">
              <h2 className="font-semibold text-lg">Titular</h2>

              <div className="mt-3 grid gap-3">
                {/* Nome 100% */}
                <div>
                  <label className="label">Nome completo</label>
                  <input
                    className="input h-11 w-full"
                    value={titular.nome}
                    onChange={(e) => updTit({ nome: e.target.value })}
                  />
                </div>

                {/* CPF + RG + Estado civil + Data  → 4 colunas iguais */}
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <label className="label">CPF</label>
                    <input
                      className={`input h-11 w-full ${
                        titular.cpf && !cpfIsValid(titular.cpf) ? "ring-1 ring-red-500" : ""
                      }`}
                      value={titular.cpf}
                      onChange={(e) => updTit({ cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="label">RG</label>
                    <input
                      className="input h-11 w-full"
                      value={titular.rg}
                      onChange={(e) => updTit({ rg: e.target.value })}
                      placeholder="RG"
                    />
                  </div>
                  <div>
                    <label className="label">Estado civil</label>
                    <select
                      className="input h-11 w-full"
                      value={titular.estado_civil}
                      onChange={(e) => updTit({ estado_civil: e.target.value })}
                    >
                      <option value="">Selecione…</option>
                      {ESTADO_CIVIL_OPTIONS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Data de nascimento</label>
                    <input
                      type="date"
                      className={`input h-11 w-full ${titularForaLimite ? "ring-1 ring-red-500" : ""}`}
                      value={titular.data_nascimento}
                      onChange={(e) => updTit({ data_nascimento: e.target.value })}
                    />
                    {titularForaLimite && (
                      <p className="mt-1 text-xs inline-flex items-center gap-1 text-red-600">
                        <AlertTriangle size={14} /> Idade fora do limite para titular deste plano.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço enxuto */}
              <div className="mt-4 grid gap-3">
                {/* Linha 1: CEP + Logradouro + Número */}
                <div className="grid gap-3 md:grid-cols-[180px,1fr,140px]">
                  <div>
                    <label className="label">CEP</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.cep}
                      onChange={(e) => updTitEndereco({ cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <label className="label">Logradouro</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.logradouro}
                      onChange={(e) => updTitEndereco({ logradouro: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Número</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.numero}
                      onChange={(e) => updTitEndereco({ numero: e.target.value })}
                    />
                  </div>
                </div>
                {/* Linha 2: Complemento + Bairro + Cidade + UF */}
                <div className="grid gap-3 md:grid-cols-[1fr,1fr,1fr,100px]">
                  <div>
                    <label className="label">Complemento</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.complemento}
                      onChange={(e) => updTitEndereco({ complemento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Bairro</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.bairro}
                      onChange={(e) => updTitEndereco({ bairro: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Cidade</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.cidade}
                      onChange={(e) => updTitEndereco({ cidade: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">UF</label>
                    <input
                      className="input h-11"
                      value={titular.endereco.uf}
                      onChange={(e) => updTitEndereco({ uf: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dependentes */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Dependentes ({deps.length})</h2>
                <CTAButton onClick={addDep} className="h-10">
                  <Plus size={16} className="mr-2" />
                  Adicionar
                </CTAButton>
              </div>

              <div className="mt-4 grid gap-4">
                {deps.map((d, i) => {
                  const issue = depsIssues[i];
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">Dependente {i + 1}</span>
                        <CTAButton variant="ghost" onClick={() => delDep(i)} className="h-9 px-3">
                          <Trash2 size={16} className="mr-2" /> Remover
                        </CTAButton>
                      </div>

                      {/* 60/20/20 (Nome/Parentesco/Data) */}
                      <div className="grid gap-3 md:grid-cols-[3fr,1fr,1fr]">
                        <div>
                          <label className="label">Nome completo</label>
                          <input
                            className="input h-11 w-full"
                            placeholder="Nome do dependente"
                            value={d.nome}
                            onChange={(e) => updDep(i, { nome: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Parentesco</label>
                          <select
                            className="input h-11 w-full"
                            value={d.parentesco}
                            onChange={(e) => updDep(i, { parentesco: e.target.value })}
                          >
                            <option value="">Selecione…</option>
                            {(PARENTESCOS_EFFECTIVE || []).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Data de nascimento</label>
                          <input
                            type="date"
                            className={`input h-11 w-full ${issue?.fora ? "ring-1 ring-red-500" : ""}`}
                            value={d.data_nascimento}
                            onChange={(e) => updDep(i, { data_nascimento: e.target.value })}
                          />
                        </div>
                      </div>

                      {d.__idade_hint && !d.data_nascimento && (
                        <p className="text-xs text-[var(--c-muted)] mt-2">
                          Dica de idade informada: {d.__idade_hint} anos.
                        </p>
                      )}
                      {issue?.fora && (
                        <p className="text-xs inline-flex items-center gap-1 text-red-600 mt-2">
                          <AlertTriangle size={14} /> Idade fora do limite para dependente.
                        </p>
                      )}
                    </div>
                  );
                })}

                <CTAButton onClick={addDep} className="w-full h-11 justify-center">
                  <Plus size={16} className="mr-2" />
                  Adicionar dependente
                </CTAButton>
              </div>

              {countDepsFora > 0 && (
                <p className="mt-2 text-xs inline-flex items-center gap-1 text-red-600">
                  <AlertTriangle size={14} /> {countDepsFora} dependente(s) fora do limite etário do plano.
                </p>
              )}
            </div>

            {/* Ações */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <CTAButton
                onClick={handleSalvarEnviar}
                disabled={saving || !!titularForaLimite}
                className="h-12 w-full"
              >
                {saving ? "Enviando…" : "Salvar e continuar"}
              </CTAButton>
              <CTAButton
                variant="outline"
                onClick={sendWhatsFallback}
                className="h-12 w-full"
                title="Enviar cadastro por WhatsApp"
              >
                <MessageCircle size={16} className="mr-2" /> Enviar por WhatsApp
              </CTAButton>
            </div>

            <p className="mt-3 text-xs text-[var(--c-muted)] inline-flex items-center gap-1">
              <CheckCircle2 size={14} /> Seus dados estão protegidos e serão usados apenas para a contratação.
            </p>
          </div>

          {/* Resumo no final */}
          <div className="p-6 bg-[var(--c-surface)] rounded-2xl border border-[var(--c-border)] shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Plano</span>
                <span className="font-medium text-right">{plano?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span>Base mensal</span>
                <span>{money(baseMensal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Incluídos no plano</span>
                <span>{numDepsIncl}</span>
              </div>
              <div className="flex justify-between">
                <span>Dependentes adicionais ({excedentes}) × {money(valorIncMensal)}</span>
                <span>{money(excedentes * valorIncMensal)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total mensal</span>
                <span className="text-[color:var(--primary)] font-extrabold">{money(totalMensal)}</span>
              </div>

              {cupom ? (
                <div className="flex justify-between">
                  <span>Cupom</span>
                  <span className="font-medium">{cupom}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* mobile sticky footer */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-surface)] md:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))", boxShadow: "0 -12px 30px rgba(0,0,0,.12)" }}
      >
        <div className="mx-auto max-w-7xl px-3 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-[var(--c-muted)] leading-tight">Total mensal</p>
            <p className="text-xl font-extrabold leading-tight">{money(totalMensal)}</p>
          </div>
          <CTAButton
            className="min-w-[44%] h-12"
            onClick={handleSalvarEnviar}
            disabled={saving || !!titularForaLimite}
          >
            {saving ? "Enviando…" : "Continuar"}
          </CTAButton>
        </div>
      </div>
      <div className="h-16 md:hidden" aria-hidden />
    </section>
  );
}
