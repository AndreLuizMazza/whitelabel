// src/pages/PerfilAlterarSenha.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPageSEO } from "@/lib/seo";
import useAuth from "@/store/auth";
import { getMe } from "@/lib/profile";
import {
  MemberSubpageNav,
  MemberSubpageHeader,
} from "@/components/member/MemberDashboardUI";
import MemberPasswordChangeForm from "@/components/member/MemberPasswordChangeForm";
import Skeleton from "@/components/ui/Skeleton.jsx";

export default function PerfilAlterarSenha() {
  const navigate = useNavigate();
  const authUser = useAuth((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setPageSEO({
      title: "Alterar senha",
      description: "Atualize a senha da sua conta.",
    });
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getMe().catch(() => null);
        if (!active) return;
        setEmail((data?.email || authUser?.email || "").trim());
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authUser?.email]);

  const headerMeta = useMemo(() => {
    if (!email) return "Conta de acesso";
    return email;
  }, [email]);

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-5">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-48 rounded-[10px]" />
        <Skeleton className="h-12 rounded-[14px]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto pb-6">
      <MemberSubpageNav to="/perfil" label="Perfil" />

      <MemberSubpageHeader
        title="Alterar senha"
        meta={headerMeta}
      />

      <p className="text-[15px] leading-relaxed mb-5 px-0.5" style={{ color: "var(--text-muted)" }}>
        Escolha uma senha forte que você não use em outros serviços.
      </p>

      <MemberPasswordChangeForm
        email={email}
        onSuccess={() => navigate("/perfil", { replace: true })}
      />

      <p className="px-0.5 mt-4 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Ao alterar a senha, você permanecerá conectado neste dispositivo.
      </p>
    </div>
  );
}
