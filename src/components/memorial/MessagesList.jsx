import { useMemo, useState } from "react";

const PAGE_SIZE = 10;

function fmtDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const data = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

function defaultBody(m) {
  const tipo = String(m?.tipo || "").toUpperCase();
  if (m?.mensagem) return m.mensagem;

  if (tipo === "VELA") return "Acendeu uma vela.";
  if (tipo === "FLOR") return "Enviou uma flor.";
  if (tipo === "LIVRO") return "Assinou o livro de presença.";
  if (tipo === "ATUALIZACOES") return "Solicitou atualizações.";
  return "Registrou uma homenagem.";
}

export default function MessagesList({ items = [], highContrast = false }) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => new Date(b?.dtInteracao) - new Date(a?.dtInteracao));
  }, [items]);

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  const ring = highContrast
    ? "ring-black/30 dark:ring-white/30"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  return (
    <section className={`rounded-3xl p-4 sm:p-6 ring-1 ${ring} bg-[var(--surface)] shadow-[0_18px_55px_rgba(0,0,0,.06)]`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] sm:text-lg font-semibold text-[var(--text)]">
            Assinaturas e mensagens
          </h3>
          <p className="mt-1 text-sm text-[var(--text)] opacity-75">
            {sorted.length} homenage{sorted.length === 1 ? "m" : "ns"}
          </p>
        </div>

        {totalPages > 1 && (
          <div className="text-xs text-[var(--text)] opacity-70">
            Página {page} de {totalPages}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {!pageItems.length ? (
          <p className="text-sm text-[var(--text)] opacity-85">Nenhuma mensagem encontrada.</p>
        ) : (
          pageItems.map((m, i) => (
            <div
              key={(m?.id || "") + "_" + i}
              className="rounded-2xl p-4 bg-[var(--surface-alt)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    {m?.nome || "Visitante"}
                  </div>
                  <div className="text-xs text-[var(--text)] opacity-70 mt-0.5">
                    {fmtDateTime(m?.dtInteracao)}
                  </div>
                </div>

                <span
                  className="text-[11px] px-2 py-1 rounded-full ring-1"
                  style={{
                    background: "color-mix(in srgb, var(--brand-50) 88%, white)",
                    borderColor: "color-mix(in srgb, var(--brand-100) 70%, var(--c-border))",
                    color: "color-mix(in srgb, var(--brand-700) 90%, black)",
                  }}
                >
                  {String(m?.tipo || "HOMENAGEM").toUpperCase()}
                </span>
              </div>

              <div className="mt-3 text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                {defaultBody(m)}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {page > 1 && (
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl px-3 py-2 text-sm ring-1 bg-[var(--surface-alt)] text-[var(--text)]"
            >
              Anterior
            </button>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={[
                "rounded-xl px-3 py-2 text-sm ring-1",
                p === page
                  ? "bg-[color:color-mix(in_srgb,var(--brand-50)_65%,var(--surface))] ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))]"
                  : "bg-[var(--surface-alt)] ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
                "text-[var(--text)]",
              ].join(" ")}
            >
              {p}
            </button>
          ))}

          {page < totalPages && (
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl px-3 py-2 text-sm ring-1 bg-[var(--surface-alt)] text-[var(--text)]"
            >
              Próximo
            </button>
          )}
        </div>
      )}
    </section>
  );
}
