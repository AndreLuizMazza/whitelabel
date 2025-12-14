import { useEffect, useMemo, useState } from "react";

function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

export default function GalleryGrid({ items = [], highContrast = false }) {
  const images = useMemo(
    () => items
      .map((x) => x?.url || x?.fotoUrl || x?.src)
      .filter(Boolean),
    [items]
  );

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  function openAt(i) {
    setIdx(clamp(i, 0, images.length - 1));
    setOpen(true);
  }
  function close() { setOpen(false); }
  function prev() { setIdx((v) => (v - 1 + images.length) % images.length); }
  function next() { setIdx((v) => (v + 1) % images.length); }

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (!images.length) {
    return (
      <div className="rounded-3xl p-4 sm:p-6 ring-1 bg-[var(--surface)]">
        <p className="text-sm text-[var(--text)]">Nenhuma foto foi adicionada ao memorial.</p>
      </div>
    );
  }

  const ring = highContrast
    ? "ring-black/30 dark:ring-white/30"
    : "ring-[color:color-mix(in_srgb,var(--c-border)_85%,transparent)] dark:ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)]";

  return (
    <>
      <div className={`rounded-3xl p-4 sm:p-6 ring-1 ${ring} bg-[var(--surface)] shadow-[0_18px_55px_rgba(0,0,0,.06)]`}>
        <h3 className="text-[15px] sm:text-lg font-semibold text-[var(--text)]">
          Galeria de Fotos
        </h3>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => openAt(i)}
              className="group relative overflow-hidden rounded-2xl ring-1 ring-[color:color-mix(in_srgb,var(--c-border)_70%,transparent)] bg-[var(--surface-alt)]"
              title="Abrir foto"
            >
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="h-32 sm:h-36 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.25) 100%)" }}
              />
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-3 sm:px-6"
          role="dialog"
          aria-modal="true"
          onMouseDown={close}
          style={{ background: "rgba(0,0,0,.62)" }}
        >
          <div
            className="relative w-full max-w-5xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute -top-10 right-0 text-white/90 hover:text-white text-sm"
            >
              Fechar (Esc)
            </button>

            <div className="relative overflow-hidden rounded-3xl bg-black ring-1 ring-white/10">
              <img
                src={images[idx]}
                alt={`Foto ${idx + 1}`}
                className="w-full max-h-[78vh] object-contain bg-black"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white"
                    aria-label="Anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white"
                    aria-label="Próxima"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-white/90 text-xs sm:text-sm"
                style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,.55) 100%)" }}
              >
                {idx + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
