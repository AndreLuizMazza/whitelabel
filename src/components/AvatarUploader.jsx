import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function AvatarUploader({ fotoUrl, onUpload, onDelete }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(fotoUrl || "");

  useEffect(() => {
    setPreview(fotoUrl || "");
  }, [fotoUrl]);

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Envie apenas imagens (JPG, PNG, etc.)", "warning");
      return;
    }

    // preview imediato
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    if (onUpload) {
      setLoading(true);
      Promise.resolve(onUpload(file))
        .then(() => showToast("Foto atualizada com sucesso."))
        .catch(() => showToast("Falha ao enviar foto.", "error"))
        .finally(() => setLoading(false));
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) return;
    setLoading(true);
    Promise.resolve(onDelete())
      .then(() => {
        setPreview("");
        showToast("Foto removida com sucesso.");
      })
      .catch(() => showToast("Falha ao remover foto.", "error"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border border-[var(--c-border)] bg-[var(--surface-alt)]">
        {preview ? (
          <img src={preview} alt="Foto do perfil" className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[var(--text-muted)]">
            <Camera size={36} />
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Loader2 className="animate-spin" size={28} />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="btn-outline text-sm flex items-center gap-1"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          <Camera size={16} /> Alterar
        </button>
        {preview && (
          <button
            type="button"
            className="btn-outline text-sm flex items-center gap-1"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={16} /> Remover
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectFile}
      />
    </div>
  );
}
