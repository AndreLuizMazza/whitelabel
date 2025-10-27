// src/pages/EsqueciSenha.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

export default function EsqueciSenha() {
  // tenta reaproveitar o que o usuário já digitou no login
  const search = new URLSearchParams(location.search);
  const initialIdent =
    search.get("i") ||
    localStorage.getItem("login.identifier") ||
    localStorage.getItem("recuperacao.identifier") ||
    "";

  const [identifier, setIdentifier] = useState(initialIdent);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);

  const hideField = useMemo(() => identifier.trim().length >= 5, [identifier]);
  const inputRef = useRef(null);

  useEffect(() => {
    // se não tiver identifier, foca no input
    if (!hideField) setTimeout(() => inputRef.current?.focus(), 0);
  }, [hideField]);

  useEffect(() => setErro(""), [identifier]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const ident = identifier.trim();
    if (!ident) return setErro("Informe e-mail, CPF ou telefone.");

    setLoading(true);
    try {
      // Envia para o BFF/API – pode aceitar email/CPF/telefone
      await api.post("/api/v1/app/password/forgot", { identifier: ident });

      // persiste para a próxima tela (Reset não precisará mostrar o campo)
      localStorage.setItem("recuperacao.identifier", ident);
      setOk(true);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Não foi possível enviar o código agora.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container-max max-w-lg">
        <h1 className="text-3xl font-bold mb-6">Esqueci minha senha</h1>

        {ok ? (
          <div className="card p-6 shadow-lg text-center space-y-3">
            <p className="text-[var(--text)]">
              Se o cadastro existir, enviamos um link/código para redefinir sua senha.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Verifique seu e-mail ou WhatsApp cadastrado (inclusive o spam).
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/login" className="btn-outline">Voltar ao login</Link>
              <Link to="/redefinir" className="btn-primary">
                Já tenho o código
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card p-6 shadow-lg space-y-4">
            {erro && (
              <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                {erro}
              </div>
            )}

            {!hideField && (
              <div>
                <label className="label font-medium">E-mail, CPF ou telefone</label>
                <input
                  ref={inputRef}
                  className="input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Digite seu e-mail, CPF ou telefone"
                  required
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Usaremos este dado apenas para enviar o link/código de redefinição.
                </p>
              </div>
            )}

            {hideField && (
              <div className="rounded-md bg-[var(--surface-alt)] p-3 text-sm">
                Vamos enviar para: <strong>{identifier}</strong>{" "}
                <button
                  type="button"
                  className="underline ml-2"
                  onClick={() => setIdentifier("")}
                >
                  alterar
                </button>
              </div>
            )}

            <button type="submit" className="btn-primary w-full h-11" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link/código"}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm underline">
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
