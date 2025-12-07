import { ChevronLeft, ChevronRight, User, Users, FileCheck2 } from "lucide-react";
import { formatCPF, formatDateBR } from "@/lib/br";

/* ============================================================
   STEP 4 — CONFIRMAÇÃO FINAL
   ============================================================ */
export default function Step4Confirmacao({
  titular,
  dependentes,
  plano,
  onPrev,
  onFinish,
  finishing,
}) {
  const titularOk = titular && titular.nome;
  const depsOk = Array.isArray(dependentes);

  if (!titularOk || !depsOk) {
    return (
      <div className="text-red-500">
        Dados ausentes. Volte e preencha corretamente.
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">

      {/* TÍTULO */}
      <h2 className="text-xl font-semibold text-[var(--c-strong)]">
        Confirme as informações antes de concluir
      </h2>

      {/* BLOCO TITULAR */}
      <Section title="Titular" icon={<User size={20} />}>
        <InfoLine label="Nome" value={titular.nome} />
        <InfoLine label="CPF" value={formatCPF(titular.cpf)} />
        <InfoLine label="Celular" value={titular.celular} />
        <InfoLine label="Nascimento" value={formatDateBR(titular.dataNascimento)} />
        {titular.email && <InfoLine label="E-mail" value={titular.email} />}
      </Section>

      {/* BLOCO DEPENDENTES */}
      {dependentes.length > 0 && (
        <Section title="Dependentes" icon={<Users size={20} />}>
          <div className="space-y-4">
            {dependentes.map((dep, i) => (
              <div
                key={i}
                className="rounded-xl bg-[var(--c-surface-2)] p-4 border border-[var(--c-surface-3)] space-y-1"
              >
                <InfoLine label="Nome" value={dep.nome} />
                {dep.cpf && <InfoLine label="CPF" value={formatCPF(dep.cpf)} />}
                <InfoLine
                  label="Nascimento"
                  value={formatDateBR(dep.dataNascimento)}
                />
                <InfoLine label="Parentesco" value={dep.parentesco} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* BLOCO PLANO */}
      {plano && (
        <Section title="Plano escolhido" icon={<FileCheck2 size={20} />}>
          <InfoLine label="Nome" value={plano.nome} />
          {plano.valor && (
            <InfoLine
              label="Valor mensal"
              value={Number(plano.valor).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />
          )}
        </Section>
      )}

      {/* BOTÕES DE NAVEGAÇÃO */}
      <div className="flex items-center gap-3 pt-6">

        {/* VOLTAR */}
        <button
          onClick={onPrev}
          disabled={finishing}
          className="w-1/2 h-14 rounded-2xl bg-[var(--c-surface-2)] text-[var(--c-muted-strong)]
                     flex items-center justify-center gap-2 hover:bg-[var(--c-surface-3)] transition"
        >
          <ChevronLeft size={20} />
          Voltar
        </button>

        {/* CONCLUIR */}
        <button
          onClick={onFinish}
          disabled={finishing}
          className={`w-1/2 h-14 rounded-2xl font-semibold flex items-center justify-center gap-2
            ${
              finishing
                ? "bg-[var(--primary)]/60 text-white cursor-wait"
                : "bg-[var(--primary)] text-white shadow-lg active:scale-[0.97]"
            }
          `}
        >
          {finishing ? (
            <div className="animate-spin border-2 border-white border-t-transparent rounded-full w-6 h-6" />
          ) : (
            <>
              Concluir
              <ChevronRight size={20} />
            </>
          )}
        </button>

      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   SECTION CONTAINER
   ------------------------------------------------------------ */
function Section({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-[var(--c-strong)] font-medium text-base">
        {icon}
        {title}
      </h3>

      <div className="rounded-2xl p-5 bg-[var(--c-surface-1)] border border-[var(--c-surface-2)] shadow-sm space-y-4">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   INFO LINE
   ------------------------------------------------------------ */
function InfoLine({ label, value }) {
  if (!value) return null;

  return (
    <div className="flex justify-between border-b border-[var(--c-surface-3)] pb-2">
      <span className="text-[var(--c-muted-strong)] text-sm">{label}</span>
      <span className="text-[var(--c-strong)] font-medium">{value}</span>
    </div>
  );
}
