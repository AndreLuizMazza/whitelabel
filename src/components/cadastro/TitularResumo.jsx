import { formatCPF, formatDateBR, formatPhoneBR } from "@/lib/br";

/** Mostra os dados do usuário (somente leitura). */
export default function TitularResumo({ titular, plano, baseMensal, money }) {
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Cadastro</h1>
      <p className="mt-1 text-sm text-[var(--c-muted)]">
        Plano <b>{plano?.nome||""}</b> — Base mensal {money(baseMensal)}
      </p>

      <div className="mt-6">
        <h2 className="font-semibold text-lg">Seus dados (usuário)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--c-border)] p-3">
            <p className="text-[var(--c-muted)] text-xs">Nome</p>
            <p className="font-medium break-words">{titular.nome || "—"}</p>
          </div>
          <div className="rounded-xl border border-[var(--c-border)] p-3">
            <p className="text-[var(--c-muted)] text-xs">CPF</p>
            <p className="font-medium">{formatCPF(titular.cpf || "") || "—"}</p>
          </div>
          <div className="rounded-xl border border-[var(--c-border)] p-3">
            <p className="text-[var(--c-muted)] text-xs">Data de nascimento</p>
            <p className="font-medium">{formatDateBR(titular.data_nascimento) || "—"}</p>
          </div>
          <div className="rounded-xl border border-[var(--c-border)] p-3">
            <p className="text-[var(--c-muted)] text-xs">Celular</p>
            <p className="font-medium">{formatPhoneBR(titular.celular || "") || "—"}</p>
          </div>
          <div className="rounded-xl border border-[var(--c-border)] p-3 md:col-span-2">
            <p className="text-[var(--c-muted)] text-xs">E-mail</p>
            <p className="font-medium break-words">{titular.email || "—"}</p>
          </div>
        </div>
      </div>
    </>
  );
}
