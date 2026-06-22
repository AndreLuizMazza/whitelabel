import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

const MAX_BYTES = 1 * 1024 * 1024;

export default function AvatarUploader({ fotoUrl, onUpload, onDelete, disabled = false }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(fotoUrl || "");

  useEffect(() => {
    setPreview(fotoUrl || "");
  }, [fotoUrl]);

  const isBusy = loading || disabled;

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || isBusy) return;

    if (!file.type.startsWith("image/")) {
      showToast("Envie apenas imagens (JPG, PNG, etc.)", "warning");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showToast(`A imagem deve ter no máximo 1 MB (arquivo atual: ${sizeMB} MB).`, "warning");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    if (onUpload) {
      setLoading(true);
      Promise.resolve(onUpload(file))
        .catch(() => {
          showToast("Falha ao enviar foto.", "error");
          setPreview(fotoUrl || "");
        })
        .finally(() => {
          setLoading(false);
          if (fileRef.current) fileRef.current.value = "";
        });
    }
  };

  const handleDelete = () => {
    if (!onDelete || isBusy) return;
    if (!confirm("Remover sua foto de perfil?")) return;

    setLoading(true);
    Promise.resolve(onDelete())
      .then(() => {
        setPreview("");
        if (fileRef.current) fileRef.current.value = "";
      })
      .catch(() => showToast("Falha ao remover foto.", "error"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        type="button"
        onClick={() => !isBusy && fileRef.current?.click()}
        disabled={isBusy}
        className="relative h-[112px] w-[112px] rounded-full overflow-hidden transition active:scale-[0.98] disabled:opacity-60"
        style={{
          background: "color-mix(in srgb, var(--text) 5%, var(--surface))",
          boxShadow: "0 0 0 0.5px var(--separator, var(--c-border))",
        }}
        aria-label="Alterar foto de perfil"
      >
        {preview ? (
          <img src={preview} alt="" className="object-cover w-full h-full" />
        ) : (
          <span className="flex items-center justify-center w-full h-full" style={{ color: "var(--text-muted)" }}>
            <Camera size={32} strokeWidth={1.75} />
          </span>
        )}
        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
            <Loader2 className="animate-spin" size={28} strokeWidth={2} />
          </span>
        ) : null}
      </button>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-[15px] font-medium min-h-[44px] px-2 transition active:opacity-60 disabled:opacity-40"
          style={{ color: "var(--primary)" }}
          onClick={() => fileRef.current?.click()}
          disabled={isBusy}
        >
          Alterar foto
        </button>
        {preview ? (
          <button
            type="button"
            className="text-[15px] font-medium min-h-[44px] px-2 transition active:opacity-60 disabled:opacity-40"
            style={{ color: "var(--danger, #ff3b30)" }}
            onClick={handleDelete}
            disabled={isBusy}
          >
            Remover
          </button>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectFile}
        disabled={isBusy}
      />
    </div>
  );
}
