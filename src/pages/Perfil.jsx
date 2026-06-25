// src/pages/Perfil.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPageSEO } from "@/lib/seo";
import useTenant from "@/store/tenant";
import useAuth from "@/store/auth";
import { showToast } from "@/lib/toast";
import {
  MemberSubpageHeader,
  formatDisplayLabel,
} from "@/components/member/MemberDashboardUI";
import { MemberGroupedList, MemberListRow } from "@/components/member/MemberGroupedList";
import {
  getMe,
  putAvatar,
  deleteAvatar,
  getAvatarBlobUrl,
} from "@/lib/profile";
import { User2, IdCard, Mail, KeyRound, LogOut, Shield, FileText, Cookie, UserX } from "lucide-react";
import AvatarUploader from "@/components/AvatarUploader";
import MemberThemeSettings from "@/components/member/MemberThemeSettings";
import AccountDeletionModal from "@/components/member/AccountDeletionModal";
import {
  openAccountDeletionRequest,
  resolvePrivacyContactEmail,
} from "@/lib/lgpdAccountDeletion";
import { displayCPF } from "@/lib/cpf";
import Skeleton from "@/components/ui/Skeleton.jsx";

function GroupLabel({ children, id }) {
  return (
    <p
      id={id}
      className="px-1 mb-2 text-[13px] font-normal uppercase tracking-[0.02em]"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </p>
  );
}

function ReadOnlyField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
      <span
        className="inline-flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[7px]"
        style={{
          background: "color-mix(in srgb, var(--primary) 12%, var(--surface))",
          color: "var(--primary)",
        }}
      >
        <Icon size={16} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span
          className="block text-[17px] leading-snug break-words mt-0.5"
          style={{ color: "var(--text)" }}
        >
          {value || "—"}
        </span>
      </span>
    </div>
  );
}

export default function Perfil() {
  const navigate = useNavigate();
  const empresa = useTenant((s) => s.empresa);
  const authUser = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState({ nome: "", email: "", cpf: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [accountDeletionOpen, setAccountDeletionOpen] = useState(false);

  const privacyContactEmail = useMemo(
    () => resolvePrivacyContactEmail(empresa),
    [empresa]
  );

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

  const displayName = me?.nome || authUser?.nome || "Associado";

  const headerMeta = useMemo(() => {
    const parts = [displayName];
    if (derivedEmail) parts.push(derivedEmail);
    return parts.join(" · ");
  }, [displayName, derivedEmail]);

  const unidadeLabel = formatDisplayLabel(
    empresa?.nomeFantasia || empresa?.razaoSocial || ""
  );

  useEffect(() => {
    setPageSEO({
      title: "Meu perfil",
      description: "Identidade, foto e segurança da conta.",
    });
  }, []);

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

  function handleAccountDeletionClick() {
    if (!privacyContactEmail) {
      showToast(
        "Canal de e-mail do prestador não está disponível. Contate a unidade pelos canais oficiais."
      );
      return;
    }
    setAccountDeletionOpen(true);
  }

  function handleAccountDeletionConfirm() {
    const result = openAccountDeletionRequest({
      empresa,
      user: {
        nome: displayName,
        email: derivedEmail,
        cpf: me?.cpf || authUser?.cpf || "",
      },
    });

    setAccountDeletionOpen(false);

    if (!result.ok) {
      if (result.reason === "no_email") {
        showToast(
          "Canal de e-mail do prestador não está disponível. Contate a unidade pelos canais oficiais."
        );
        return;
      }
      showToast("Não foi possível abrir o aplicativo de e-mail neste dispositivo.");
      return;
    }

    showToast("Envie o e-mail pré-preenchido para concluir sua solicitação.");
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-5">
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-[180px] rounded-[10px]" />
        <Skeleton className="h-44 rounded-[10px]" />
        <Skeleton className="h-14 rounded-[10px]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-4">
      <MemberSubpageHeader title="Perfil" meta={headerMeta} />

      {unidadeLabel ? (
        <p className="text-[13px] mb-5 px-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
          {unidadeLabel}
        </p>
      ) : null}

      <div className="space-y-5">
        <section aria-labelledby="sec-foto">
          <GroupLabel id="sec-foto">Foto de perfil</GroupLabel>
          <MemberGroupedList>
            <div className="px-4 py-5">
              <AvatarUploader
                fotoUrl={avatarUrl}
                onUpload={onUploadPhoto}
                onDelete={onDeletePhoto}
                disabled={photoSaving}
              />
            </div>
          </MemberGroupedList>
          <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Vinculada à carteirinha digital. PNG ou JPG, até 1 MB.
          </p>
        </section>

        <section aria-labelledby="sec-identificacao">
          <GroupLabel id="sec-identificacao">Identificação</GroupLabel>
          <MemberGroupedList>
            <ReadOnlyField icon={User2} label="Nome" value={displayName} />
            <ReadOnlyField icon={Mail} label="E-mail" value={derivedEmail} />
            <ReadOnlyField icon={IdCard} label="CPF" value={cpfMasked} />
          </MemberGroupedList>
          <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Para alterar dados cadastrais, contate a unidade.
          </p>
        </section>

        <section aria-labelledby="sec-aparencia">
          <GroupLabel id="sec-aparencia">Aparência</GroupLabel>
          <MemberThemeSettings />
          <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Escolha como o app deve ser exibido neste dispositivo.
          </p>
        </section>

        <section aria-labelledby="sec-conta">
          <GroupLabel id="sec-conta">Conta</GroupLabel>
          <MemberGroupedList>
            <MemberListRow
              icon={KeyRound}
              label="Alterar senha"
              detail="Segurança da sua conta"
              to="/perfil/senha"
            />
          </MemberGroupedList>
        </section>

        <section aria-labelledby="sec-legal">
          <GroupLabel id="sec-legal">Legal e privacidade</GroupLabel>
          <MemberGroupedList>
            <MemberListRow
              icon={Shield}
              label="Política de Privacidade"
              detail="Como tratamos seus dados"
              to="/area/legal/privacidade"
            />
            <MemberListRow
              icon={FileText}
              label="Termos de Uso"
              detail="Regras de uso do app"
              to="/area/legal/termos"
            />
            <MemberListRow
              icon={Cookie}
              label="Política de Cookies"
              detail="Cookies e armazenamento local"
              to="/area/legal/cookies"
            />
            <MemberListRow
              icon={Cookie}
              label="Preferências de cookies"
              detail="Revisar consentimento neste dispositivo"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-cookie-banner"));
              }}
              showChevron={false}
            />
            <MemberListRow
              icon={UserX}
              label="Encerrar conta"
              detail="Direito do titular · art. 18 LGPD"
              onClick={handleAccountDeletionClick}
              destructive
              showChevron={false}
            />
          </MemberGroupedList>
          <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            A solicitação é formalizada por e-mail ao prestador. O processamento ocorre fora deste aplicativo.
          </p>
        </section>

        <section aria-labelledby="sec-sessao" className="md:hidden">
          <GroupLabel id="sec-sessao">Sessão</GroupLabel>
          <MemberGroupedList>
            <MemberListRow
              icon={LogOut}
              label="Sair do app"
              detail="Encerrar sessão neste dispositivo"
              onClick={handleLogout}
              destructive
              showChevron={false}
            />
          </MemberGroupedList>
        </section>
      </div>

      <AccountDeletionModal
        open={accountDeletionOpen}
        onClose={() => setAccountDeletionOpen(false)}
        onConfirm={handleAccountDeletionConfirm}
        tenantLabel={unidadeLabel || "prestador de serviços"}
        contactEmail={privacyContactEmail}
      />
    </div>
  );
}
