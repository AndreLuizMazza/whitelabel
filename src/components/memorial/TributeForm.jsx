import { useMemo, useState } from "react";
import CTAButton from "@/components/ui/CTAButton";

const TYPES = [
  { key: "MENSAGEM", label: "Enviar Mensagem", needsText: true },
  { key: "LIVRO", label: "Assinar Livro", needsText: false },
  { key: "VELA", label: "Acender Vela", needsText: false },
  { key: "FLOR", label: "Enviar Flor", needsText: false },
];

function normalizeContato(v) {
  return String(v || "").trim();
}

export default function TributeForm({
  obitoId,
  nomeFalecido,
  onSubmit,
  highContrast = false,
  termosHref = "/termos-de-servico.html",
  privacidadeHref = "/politica-de-privacidade.html",
}) {
  const [tipo, setTipo] = useState("MENSAGEM");
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const selected = useMemo(() => TYPES.find((t) => t.key === tipo), [tipo]);

  async function submit() {
    setErr("");

    if (!accepted) return setErr("Você precisa concordar com os Termos e a Política de Privacidade.");
    if (!String(nome).trim()) return setErr("Informe seu nome.");
    if (!normalizeContato(contato)) return setErr("Informe um WhatsApp ou e-mail para contato.");
    if (selected?.needsText && !String(mensagem).trim()) return setErr("Escreva sua mensagem.");

    const payload = {
      tipo,
      nome: String(nome).trim(),
      contato: normalizeContato(contato),
      mensagem: selected?.needsText ? String(mensagem).trim() : null,
      // opcional: origem/tenant/utm se você quiser rastrear leads
      origem: "WHITELABEL",
    };

    try {
      setSending(true);
      await onSubmit?.(obitoId, payload);
      // reset suave (mantém tipo)
      setNome("");
      setContato("");
      setMensagem("");
      setAccepted(false);
    } catch (e) {
      setErr("Não foi possível enviar sua homenagem. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  const ring = highContrast
    ? "ring-black/30 dark:ring-white/30"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  return (
    <section className={`rounded-3xl p-4 sm:p-6 ring-1 ${ring} bg-[var(--surface)] shadow-[0_18px_55px_rgba(0,0,0,.06)]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] sm:text-lg font-semibold text-[var(--text)]">
            Deixe sua homenagem
          </h3>
          <p className="mt-1 text-sm text-[var(--text)] opacity-85">
            Seu gesto de carinho será eternizado neste memorial de <span className="font-semibold">{nomeFalecido}</span>.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTipo(t.key)}
            className={[
              "rounded-2xl px-3 py-3 ring-1 text-left transition",
              "bg-[var(--surface-alt)] hover:bg-[color:color-mix(in_srgb,var(--surface-alt)_60%,var(--brand-50))]",
              tipo === t.key
                ? "ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))]"
                : "ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]",
            ].join(" ")}
          >
            <div className="text-sm font-semibold text-[var(--text)]">{t.label}</div>
            <div className="text-xs mt-1 opacity-70 text-[var(--text)]">
              {t.needsText ? "Com mensagem" : "Registro no memorial"}
            </div>
          </button>
        ))}
      </div>

      {selected?.needsText && (
        <div className="mt-4">
          <label className="text-sm font-medium text-[var(--text)]">Sua mensagem</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl px-3 py-3 bg-[var(--surface-alt)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)] text-[var(--text)] outline-none focus:ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))]"
            placeholder="Escreva sua homenagem aqui…"
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-[var(--text)]">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-2 w-full rounded-2xl px-3 py-3 bg-[var(--surface-alt)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)] text-[var(--text)] outline-none focus:ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))]"
            placeholder="Digite seu nome"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--text)]">WhatsApp ou e-mail</label>
          <input
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            className="mt-2 w-full rounded-2xl px-3 py-3 bg-[var(--surface-alt)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)] text-[var(--text)] outline-none focus:ring-[color:color-mix(in_srgb,var(--brand)_55%,var(--c-border))]"
            placeholder="Seu contato"
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl px-3 py-3 bg-[color:color-mix(in_srgb,var(--surface-alt)_70%,transparent)] ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_65%,transparent)]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-[var(--text)] opacity-90">
            Li e concordo com os{" "}
            <a className="underline" href={termosHref} target="_blank" rel="noreferrer">Termos</a>{" "}
            e a{" "}
            <a className="underline" href={privacidadeHref} target="_blank" rel="noreferrer">Política de Privacidade</a>.
          </span>
        </label>
      </div>

      {err && (
        <div className="mt-3 text-sm text-red-600">
          {err}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end">
        <CTAButton
          onClick={submit}
          disabled={sending}
          className="w-full sm:w-auto"
        >
          {sending ? "Enviando…" : "Enviar homenagem"}
        </CTAButton>
      </div>
    </section>
  );
}
