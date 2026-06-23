import { useRef, useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { changePassword } from "@/lib/profile";
import { showToast } from "@/lib/toast";
import { MemberGroupedList } from "@/components/member/MemberGroupedList";

function evalPassword(pwd = "") {
  const lengthOK = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const score = [lengthOK, hasUpper, hasLower, hasDigit].filter(Boolean).length;
  return { lengthOK, hasUpper, hasLower, hasDigit, score };
}

function strengthLabel(score) {
  switch (score) {
    case 4:
      return "Forte";
    case 3:
      return "Boa";
    case 2:
      return "Fraca";
    default:
      return "Muito fraca";
  }
}

function extractApiError(err) {
  try {
    const data = err?.response?.data || err?.data || {};
    const message = data?.message || err?.message || "Falha ao processar a solicitação.";
    const fieldErrors = data?.fieldErrors || null;
    return { message, fieldErrors };
  } catch {
    return { message: "Falha ao processar a solicitação.", fieldErrors: null };
  }
}

function ReqItem({ ok, label }) {
  return (
    <li className="flex items-center gap-2.5 min-h-[26px]">
      {ok ? (
        <CheckCircle2 size={15} strokeWidth={2.25} style={{ color: "#30d158" }} aria-hidden="true" />
      ) : (
        <span
          className="inline-flex h-3.5 w-3.5 shrink-0 rounded-full border"
          style={{ borderColor: "var(--separator, var(--c-border))" }}
          aria-hidden="true"
        />
      )}
      <span className="text-[13px] leading-snug" style={{ color: ok ? "var(--text-muted)" : "var(--text)" }}>
        {label}
      </span>
    </li>
  );
}

function PasswordFieldRow({
  label,
  name,
  value,
  onChange,
  error,
  autoComplete,
  inputRef,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="px-4 py-2.5">
      <label htmlFor={name} className="block">
        <span className="block text-[13px] leading-snug mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span className="flex items-center gap-2 min-h-[32px]">
          <input
            id={name}
            name={name}
            ref={inputRef}
            type={visible ? "text" : "password"}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${name}-error` : undefined}
            className="flex-1 min-w-0 border-0 bg-transparent p-0 text-[17px] outline-none"
            style={{ color: "var(--text)" }}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:opacity-60"
            style={{ color: "var(--text-muted)" }}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? <EyeOff size={18} strokeWidth={1.85} /> : <Eye size={18} strokeWidth={1.85} />}
          </button>
        </span>
      </label>
      {error ? (
        <p
          id={`${name}-error`}
          className="text-[13px] mt-1.5 leading-snug"
          style={{ color: "var(--danger, #ff3b30)" }}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function MemberPasswordChangeForm({ email, onSuccess }) {
  const [pw, setPw] = useState({ senhaAtual: "", novaSenha: "", confirma: "" });
  const [errors, setErrors] = useState({});
  const [pwdEval, setPwdEval] = useState(evalPassword(""));
  const [saving, setSaving] = useState(false);
  const firstErrorRef = useRef(null);

  const focusFirstError = () => {
    setTimeout(() => {
      firstErrorRef.current?.focus?.();
    }, 0);
  };

  const validate = () => {
    const e = {};
    if (!email) e._email = "E-mail não disponível.";
    if (!pw.senhaAtual?.trim()) e.senhaAtual = "Informe a senha atual.";

    const { lengthOK, hasUpper, hasLower, hasDigit } = evalPassword(pw.novaSenha || "");
    if (!pw.novaSenha?.trim()) e.novaSenha = "Informe a nova senha.";
    else {
      if (!lengthOK) e.novaSenha = "A senha deve ter pelo menos 8 caracteres.";
      else if (!hasUpper) e.novaSenha = "A senha deve conter pelo menos 1 letra maiúscula.";
      else if (!hasLower) e.novaSenha = "A senha deve conter pelo menos 1 letra minúscula.";
      else if (!hasDigit) e.novaSenha = "A senha deve conter pelo menos 1 dígito.";
    }

    if (!pw.confirma?.trim()) e.confirma = "Confirme a nova senha.";
    else if (pw.novaSenha !== pw.confirma) e.confirma = "As senhas não coincidem.";

    setErrors(e);
    firstErrorRef.current = null;
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast("Corrija os erros para continuar.", "warning");
      focusFirstError();
      return;
    }

    try {
      setSaving(true);
      await changePassword({
        email,
        senhaAtual: pw.senhaAtual,
        novaSenha: pw.novaSenha,
      });
      setPw({ senhaAtual: "", novaSenha: "", confirma: "" });
      setPwdEval(evalPassword(""));
      setErrors({});
      showToast("Senha alterada com sucesso.", "success");
      onSuccess?.();
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err);
      const nextErrors = { ...errors };
      const m = (message || "").trim();

      if (m === "A senha deve ter pelo menos 8 caracteres.") nextErrors.novaSenha = m;
      else if (m === "A senha deve conter pelo menos 1 letra maiúscula.") nextErrors.novaSenha = m;
      else if (m === "A senha deve conter pelo menos 1 letra minúscula.") nextErrors.novaSenha = m;
      else if (m === "A senha deve conter pelo menos 1 dígito.") nextErrors.novaSenha = m;
      else if (m.toLowerCase().includes("senha atual")) nextErrors.senhaAtual = message;

      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fe) => {
          const field = (fe?.field || "").toString();
          const msg = fe?.message || "";
          if (field && msg) nextErrors[field] = msg;
        });
      }

      setErrors(nextErrors);
      showToast(message, "error");
      focusFirstError();
    } finally {
      setSaving(false);
    }
  };

  const localReqs = evalPassword(pw.novaSenha || "");
  const canSubmit =
    email &&
    pw.senhaAtual?.trim() &&
    pw.novaSenha?.trim() &&
    localReqs.lengthOK &&
    localReqs.hasUpper &&
    localReqs.hasLower &&
    localReqs.hasDigit &&
    pw.confirma?.trim() &&
    pw.confirma === pw.novaSenha;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <MemberGroupedList>
        <PasswordFieldRow
          label="Senha atual"
          name="senhaAtual"
          value={pw.senhaAtual}
          onChange={(e) => {
            setPw((p) => ({ ...p, senhaAtual: e.target.value }));
            if (errors.senhaAtual) setErrors((x) => ({ ...x, senhaAtual: undefined }));
          }}
          error={errors.senhaAtual}
          autoComplete="current-password"
          inputRef={(el) => {
            if (errors.senhaAtual && !firstErrorRef.current) firstErrorRef.current = el;
          }}
        />
        <PasswordFieldRow
          label="Nova senha"
          name="novaSenha"
          value={pw.novaSenha}
          onChange={(e) => {
            const v = e.target.value || "";
            setPw((p) => ({ ...p, novaSenha: v }));
            setPwdEval(evalPassword(v));
            if (errors.novaSenha) setErrors((x) => ({ ...x, novaSenha: undefined }));
            if (pw.confirma && pw.confirma !== v) {
              setErrors((x) => ({ ...x, confirma: "As senhas não coincidem." }));
            } else if (errors.confirma) {
              setErrors((x) => ({ ...x, confirma: undefined }));
            }
          }}
          error={errors.novaSenha}
          autoComplete="new-password"
          inputRef={(el) => {
            if (errors.novaSenha && !firstErrorRef.current) firstErrorRef.current = el;
          }}
        />
        <PasswordFieldRow
          label="Confirmar senha"
          name="confirma"
          value={pw.confirma}
          onChange={(e) => {
            const v = e.target.value || "";
            setPw((p) => ({ ...p, confirma: v }));
            if (v && v !== pw.novaSenha) {
              setErrors((x) => ({ ...x, confirma: "As senhas não coincidem." }));
            } else if (errors.confirma) {
              setErrors((x) => ({ ...x, confirma: undefined }));
            }
          }}
          error={errors.confirma}
          autoComplete="new-password"
          inputRef={(el) => {
            if (errors.confirma && !firstErrorRef.current) firstErrorRef.current = el;
          }}
        />
      </MemberGroupedList>

      <div className="px-1 space-y-3" aria-live="polite">
        <div>
          <div className="mb-1.5 flex justify-between text-[13px]" style={{ color: "var(--text-muted)" }}>
            <span>Força da senha</span>
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {strengthLabel(pwdEval.score)}
            </span>
          </div>
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ background: "color-mix(in srgb, var(--text) 8%, var(--surface))" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(pwdEval.score / 4) * 100}%`,
                background:
                  pwdEval.score >= 4
                    ? "#30d158"
                    : pwdEval.score === 3
                      ? "var(--primary)"
                      : pwdEval.score === 2
                        ? "#ff9500"
                        : "#ff3b30",
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <ul className="space-y-1">
          <ReqItem ok={pwdEval.lengthOK} label="Pelo menos 8 caracteres" />
          <ReqItem ok={pwdEval.hasUpper} label="Uma letra maiúscula" />
          <ReqItem ok={pwdEval.hasLower} label="Uma letra minúscula" />
          <ReqItem ok={pwdEval.hasDigit} label="Um dígito numérico" />
        </ul>

        {errors._email ? (
          <p className="text-[13px]" style={{ color: "var(--danger, #ff3b30)" }} role="alert">
            {errors._email}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={saving || !canSubmit}
        className="w-full min-h-[50px] rounded-[14px] text-[17px] font-semibold transition active:opacity-90 disabled:opacity-40"
        style={{
          background: "var(--primary)",
          color: "var(--on-primary, #fff)",
        }}
      >
        {saving ? "Atualizando…" : "Alterar senha"}
      </button>
    </form>
  );
}
