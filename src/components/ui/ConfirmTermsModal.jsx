import ConfirmModal from "@/components/ui/ConfirmModal";
import { ShieldCheck } from "lucide-react";

export default function ConfirmTermsModal({
  open,
  onClose,
  onConfirm,
  termosHref = "/termos-de-servico.html",
  privacidadeHref = "/politica-de-privacidade.html",
  loading = false,
}) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      icon={ShieldCheck}
      title="Confirmar envio da homenagem"
      description={
        <>
          Ao continuar, você confirma que leu e concorda com os{" "}
          <a
            className="underline font-semibold"
            href={termosHref}
            target="_blank"
            rel="noreferrer"
          >
            Termos de Serviço
          </a>{" "}
          e a{" "}
          <a
            className="underline font-semibold"
            href={privacidadeHref}
            target="_blank"
            rel="noreferrer"
          >
            Política de Privacidade
          </a>
          .
        </>
      }
      confirmText="Concordar e enviar"
      cancelText="Cancelar"
      closeOnBackdrop={true}
      closeOnEsc={true}
      disableConfirm={false}
    />
  );
}
