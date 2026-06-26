import { APP_VERSION, APP_BUILD_ISO } from "@/generated/appMeta.js";

/** Rótulo curto: v1.0.0 */
export function getAppVersionLabel() {
  return `v${APP_VERSION}`;
}

/** Data/hora do build em pt-BR */
export function formatAppBuildDateTime(iso = APP_BUILD_ISO) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Rótulo completo para UI: v1.0.0 · build 16/06/2026, 14:32 */
export function formatAppBuildLabel() {
  return `${getAppVersionLabel()} · build ${formatAppBuildDateTime()}`;
}

export { APP_VERSION, APP_BUILD_ISO };
