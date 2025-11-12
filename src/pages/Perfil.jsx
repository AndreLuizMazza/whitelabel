// src/pages/Perfil.jsx
import { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { setPageSEO } from "@/lib/seo";
import useTenant from "@/store/tenant";
import useAuth from "@/store/auth";
import { showToast } from "@/lib/toast";
import BackButton from "@/components/BackButton";
import {
  getMe,
  changePassword,
  putAvatar,
  deleteAvatar,
  getAvatarBlobUrl,
} from "@/lib/profile";
import {
  User2,
  ShieldCheck,
  Image as ImageIcon,
  Building2,
  IdCard,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import AvatarUploader from "@/components/AvatarUploader";
import { displayCPF } from "@/lib/cpf";

/* ====== Config rotas ====== */
const FALLBACK_ROUTE = "/area-do-associado"; // ajuste se necessário

/* ====== UI Primitives ====== */
const Card = ({ icon: Icon, title, description, footer, children, className = "", id }) => (
  <section
    id={id}
    className={`rounded-2xl border border-[var(--c-border)] bg-[var(--surface)] shadow-sm ${className}`}
    aria-label={title}
  >
    <header className="flex items-center gap-3 border-b border-[var(--c-border)] px-4 py-3">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
        aria-hidden
      >
        <Icon className="h-5 w-5 text-[var(--primary)]" />
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
    </header>
    <div className="px-4 py-4">{children}</div>
    {footer ? (
      <footer className="flex items-center justify-end gap-3 border-t border-[var(--c-border)] px-4 py-3">
        {footer}
      </footer>
    ) : null}
  </section>
);

const Input = forwardRef(function InputBase({ label, error, hint, ...props }, ref) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        ref={ref}
        {...props}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${props.name}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition
                    bg-[var(--surface)] text-[var(--text)]
                    border-[var(--c-border)] focus:border-[var(--primary)] ${props.className || ""}`}
      />
      {hint ? <span className="text-xs text-[var(--text-muted)]">{hint}</span> : null}
      {error ? (
        <span id={`${props.name}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
});

/* ====== Helpers de senha (espelha a regra da API) ====== */
function evalPassword(pwd = "") {
  const lengthOK = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const score = [lengthOK, hasUpper, hasLower, hasDigit].filter(Boolean).length; // 0..4
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
    return { message, fieldErrors, raw: data };
  } catch {
    return { message: "Falha ao processar a solicitação.", fieldErrors: null, raw: null };
  }
}

/* ====== Página ====== */
export default function Perfil() {
  const navigate = useNavigate();
  const empresa = useTenant((s) => s.empresa);
  const authUser = useAuth((s) => s.user);

  const [loading, setLoading] = useState(true);

  // Perfil mínimo
  const [me, setMe] = useState({ nome: "", email: "", cpf: "" });

  // Avatar (ObjectURL do blob atual)
  const [avatarUrl, setAvatarUrl] = useState("");

  // Estado da foto/senha
  const [photoSaving, setPhotoSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Form de senha
  const [pw, setPw] = useState({ senhaAtual: "", novaSenha: "", confirma: "" });
  const [errors, setErrors] = useState({});
  const [pwdEval, setPwdEval] = useState(evalPassword(""));

  const firstErrorRef = useRef(null);
  const mountedRef = useRef(false);
  const lastObjectUrlRef = useRef("");

  const cpfMasked = useMemo(
    () => displayCPF(me?.cpf || authUser?.cpf || ""),
    [me?.cpf, authUser?.cpf]
  );
  const derivedEmail = useMemo(
    () => (me?.email || authUser?.email || "").trim(),
    [me?.email, authUser?.email]
  );

  useEffect(() => {
    setPageSEO({
      title: "Meu perfil",
      description: "Segurança da conta, identidade e foto de perfil.",
    });
  }, []);

  // Carregamento inicial de /me e do avatar
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    (async () => {
      try {
        setLoading(true);

        const data = await getMe().catch(() => null);
        if (data) {
          setMe({
            nome: data?.nome ?? authUser?.nome ?? "",
            email: data?.email ?? authUser?.email ?? "",
            cpf: data?.cpf ?? authUser?.cpf ?? "",
          });
        } else {
          setMe({
            nome: authUser?.nome ?? "",
            email: authUser?.email ?? "",
            cpf: authUser?.cpf ?? "",
          });
        }

        const url = await getAvatarBlobUrl().catch(() => "");
        if (url) {
          if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
          lastObjectUrlRef.current = url;
          setAvatarUrl(url);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBack = () => {
    if (window?.history?.length > 1) {
      navigate(-1);
    } else {
      navigate(FALLBACK_ROUTE);
    }
  };

  const focusFirstError = () => {
    setTimeout(() => {
      if (firstErrorRef.current?.focus) firstErrorRef.current.focus();
    }, 0);
  };

  /* ====== Validação local completa ====== */
  const pwValidate = () => {
    const e = {};
    if (!derivedEmail) e._email = "E-mail não disponível.";
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

  /* ====== Ações ====== */
  const onChangePassword = async () => {
    if (!pwValidate()) {
      showToast("Corrija os erros para continuar.", "warning");
      focusFirstError();
      return;
    }
    try {
      setPwSaving(true);
      await changePassword({
        email: derivedEmail,
        senhaAtual: pw.senhaAtual,
        novaSenha: pw.novaSenha,
      });
      setPw({ senhaAtual: "", novaSenha: "", confirma: "" });
      setPwdEval(evalPassword(""));
      setErrors({});
      showToast("Senha alterada com sucesso.", "success");
    } catch (err) {
      const { message, fieldErrors } = extractApiError(err);
      const nextErrors = { ...errors };

      // Mensagens padronizadas da API
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
      firstErrorRef.current = null;
      focusFirstError();
    } finally {
      setPwSaving(false);
    }
  };

  const refreshAvatar = async () => {
    const url = await getAvatarBlobUrl().catch(() => "");
    if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
    lastObjectUrlRef.current = url || "";
    setAvatarUrl(url || "");
  };

  const onUploadPhoto = async (file) => {
    try {
      setPhotoSaving(true);
      await putAvatar(file);
      await refreshAvatar();
      showToast("Foto atualizada com sucesso.");
    } catch (e) {
      console.error(e);
      showToast("Falha ao enviar a foto.", "error");
    } finally {
      setPhotoSaving(false);
    }
  };

  const onDeletePhoto = async () => {
    try {
      setPhotoSaving(true);
      await deleteAvatar();
      if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = "";
      setAvatarUrl("");
      showToast("Foto removida com sucesso.");
    } catch (e) {
      console.error(e);
      showToast("Não foi possível remover a foto.", "error");
    } finally {
      setPhotoSaving(false);
    }
  };

  /* ====== Render ====== */
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse grid grid-cols-1 gap-6 md:grid-cols-[320px,1fr]">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded bg-[var(--surface-alt)]" />
            <div className="h-72 rounded-2xl bg-[var(--surface-alt)]" />
            <div className="h-28 rounded-2xl bg-[var(--surface-alt)]" />
          </div>
          <div className="space-y-4">
            <div className="h-20 rounded-2xl bg-[var(--surface-alt)]" />
            <div className="h-72 rounded-2xl bg-[var(--surface-alt)]" />
          </div>
        </div>
      </div>
    );
  }

  // Bloqueio local do botão (antes de ir ao backend)
  const localReqs = evalPassword(pw.novaSenha || "");
  const hasLocalBlock =
    !derivedEmail ||
    !pw.senhaAtual?.trim() ||
    !pw.novaSenha?.trim() ||
    !localReqs.lengthOK ||
    !localReqs.hasUpper ||
    !localReqs.hasLower ||
    !localReqs.hasDigit ||
    !pw.confirma?.trim() ||
    pw.confirma !== pw.novaSenha;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Barra superior com Voltar */}
      <div className="mb-4 flex items-center justify-between">
       <BackButton to="/area" className="mb-4" />
      </div>

      {/* Cabeçalho */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Meu perfil</h1>
          <p className="text-[var(--text-muted)]">
            Segurança da conta, identidade e foto de perfil.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--surface)] px-3 py-2">
          <Building2 className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          <span className="text-sm">{empresa?.nomeFantasia || "—"}</span>
        </div>
      </header>

      {/* Layout principal */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px,1fr]">
        {/* Coluna esquerda: Avatar + Identificação */}
        <div className="md:sticky md:top-4 md:self-start space-y-6">
          <Card
            icon={ImageIcon}
            title="Foto de perfil"
            description="PNG ou JPG (recomendado 512×512)."
            id="sec-foto"
          >
            <div className="grid grid-cols-1 gap-6">
              <AvatarUploader
                fotoUrl={avatarUrl}
                onUpload={onUploadPhoto}
                onDelete={onDeletePhoto}
                disabled={photoSaving}
              />
              <p className="text-sm text-[var(--text-muted)]">
                A imagem enviada é vinculada a sua carteirinha. Use uma foto nítida e centralizada.
              </p>
            </div>
          </Card>

          <Card icon={User2} title="Identificação" description="Dados básicos (somente leitura).">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--surface)] px-3 py-2">
                <User2 className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                <span className="truncate">{me?.nome || authUser?.nome || "—"}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--surface)] px-3 py-2">
                <Mail className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                <span className="truncate">{derivedEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--surface)] px-3 py-2">
                <IdCard className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                <span className="truncate">{cpfMasked || "—"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna direita: Segurança da conta */}
        <div className="space-y-6">
          <Card
            icon={ShieldCheck}
            title="Alterar senha"
            description="Mantenha sua conta segura."
            id="sec-senha"
            footer={
              <button
                onClick={onChangePassword}
                disabled={pwSaving || hasLocalBlock}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-[var(--on-primary)] transition hover:opacity-95 disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" aria-hidden />
                Atualizar senha
              </button>
            }
          >
            <div
              className="mb-4 rounded-lg border border-[var(--c-border)] bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text-muted)]"
              role="note"
            >
              A senha será atualizada para a conta vinculada a <strong>{derivedEmail || "—"}</strong>.
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                name="senhaAtual"
                label="Senha atual"
                type="password"
                value={pw.senhaAtual}
                onChange={(e) => {
                  setPw((p) => ({ ...p, senhaAtual: e.target.value }));
                  if (errors.senhaAtual) setErrors((x) => ({ ...x, senhaAtual: undefined }));
                }}
                error={errors.senhaAtual}
                autoComplete="current-password"
                placeholder="Digite sua senha atual"
                ref={(el) => {
                  if (errors.senhaAtual && !firstErrorRef.current) firstErrorRef.current = el;
                }}
              />

              <Input
                name="novaSenha"
                label="Nova senha"
                type="password"
                value={pw.novaSenha}
                onChange={(e) => {
                  const v = e.target.value || "";
                  setPw((p) => ({ ...p, novaSenha: v }));
                  setPwdEval(evalPassword(v));
                  // limpa erros ao digitar
                  if (errors.novaSenha) setErrors((x) => ({ ...x, novaSenha: undefined }));
                  // valida confirmação on the fly para dar feedback imediato
                  if (pw.confirma && pw.confirma !== v) {
                    setErrors((x) => ({ ...x, confirma: "As senhas não coincidem." }));
                  } else if (errors.confirma) {
                    setErrors((x) => ({ ...x, confirma: undefined }));
                  }
                }}
                error={errors.novaSenha}
                autoComplete="new-password"
                placeholder="Crie uma nova senha"
                ref={(el) => {
                  if (errors.novaSenha && !firstErrorRef.current) firstErrorRef.current = el;
                }}
              />

              <Input
                name="confirma"
                label="Confirmar nova senha"
                type="password"
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
                placeholder="Repita a nova senha"
                ref={(el) => {
                  if (errors.confirma && !firstErrorRef.current) firstErrorRef.current = el;
                }}
              />
            </div>

            {/* Indicador de força + checklist dos requisitos */}
            <div className="mt-4 space-y-3" aria-live="polite">
              {/* Barra de força */}
              <div>
                <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                  <span>Força da senha</span>
                  <span>{strengthLabel(pwdEval.score)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-[var(--surface-alt)]">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(pwdEval.score / 4) * 100}%`,
                      background:
                        pwdEval.score >= 4
                          ? "var(--primary)"
                          : pwdEval.score === 3
                          ? "color-mix(in srgb, var(--primary) 70%, #ffb300)"
                          : pwdEval.score === 2
                          ? "color-mix(in srgb, #ff9800 90%, transparent)"
                          : "#ef4444",
                    }}
                    aria-hidden
                  />
                </div>
              </div>

              {/* Checklist */}
              <ul className="grid grid-cols-1 gap-2 text-sm">
                <ReqItem ok={pwdEval.lengthOK} label="Pelo menos 8 caracteres" />
                <ReqItem ok={pwdEval.hasUpper} label="Ao menos 1 letra maiúscula (A-Z)" />
                <ReqItem ok={pwdEval.hasLower} label="Ao menos 1 letra minúscula (a-z)" />
                <ReqItem ok={pwdEval.hasDigit} label="Ao menos 1 dígito (0-9)" />
              </ul>

              {errors._email ? (
                <p className="text-sm text-red-600" role="alert">
                  {errors._email}
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* Item da checklist de requisitos */
function ReqItem({ ok, label }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden style={{ color: "var(--primary)" }} />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" aria-hidden />
      )}
      <span className={ok ? "text-[var(--text-muted)]" : "text-[var(--text)]"}>{label}</span>
    </li>
  );
}
