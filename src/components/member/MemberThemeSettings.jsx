import { useCallback, useEffect, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { applyTheme, resolveTheme } from "@/theme/initTheme";
import { MemberGroupedList } from "@/components/member/MemberGroupedList";

const OPTIONS = [
  {
    id: "system",
    label: "Automático",
    detail: "Segue o tema do dispositivo",
    icon: Monitor,
  },
  {
    id: "light",
    label: "Claro",
    detail: "Sempre usar tema claro",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Escuro",
    detail: "Sempre usar tema escuro",
    icon: Moon,
  },
];

function readChoice() {
  return resolveTheme();
}

export default function MemberThemeSettings() {
  const [choice, setChoice] = useState(readChoice);

  const sync = useCallback(() => {
    setChoice(readChoice());
  }, []);

  useEffect(() => {
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.addEventListener("storage", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  function selectTheme(id) {
    applyTheme(id);
    setChoice(id);
  }

  return (
    <MemberGroupedList>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = choice === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => selectTheme(opt.id)}
            className="flex items-center gap-3 w-full min-h-[56px] px-4 py-3 text-left transition active:opacity-80"
            aria-pressed={selected}
          >
            <span
              className="inline-flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[7px]"
              style={{
                background: selected
                  ? "color-mix(in srgb, var(--primary) 14%, var(--surface))"
                  : "color-mix(in srgb, var(--text) 6%, var(--surface))",
                color: selected ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[17px] leading-snug" style={{ color: "var(--text)" }}>
                {opt.label}
              </span>
              <span className="block text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {opt.detail}
              </span>
            </span>
            {selected ? (
              <Check size={18} strokeWidth={2.5} className="shrink-0" style={{ color: "var(--primary)" }} />
            ) : null}
          </button>
        );
      })}
    </MemberGroupedList>
  );
}
