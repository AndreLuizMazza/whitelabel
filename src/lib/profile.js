import api from "@/lib/api";
import useTenant from "@/store/tenant";

/** Injeta X-Progem-ID quando disponível */
function withTenant(cfg = {}) {
  const state = useTenant.getState();
  const tenantId = state?.empresa?.id;
  const headers = { ...(cfg.headers || {}) };
  if (tenantId && !headers["X-Progem-ID"]) headers["X-Progem-ID"] = String(tenantId);
  return { ...cfg, headers };
}

/** GET /api/v1/app/me */
export async function getMe() {
  const r = await api.get("/api/v1/app/me", withTenant());
  return r.data;
}

/** POST /api/v1/app/password/change */
export async function changePassword({ email, senhaAtual, novaSenha }) {
  const r = await api.post(
    "/api/v1/app/password/change",
    { email, senhaAtual, novaSenha },
    withTenant({ headers: { "Content-Type": "application/json" } })
  );
  return r.data ?? {};
}

/** PUT /api/v1/app/me/avatar (multipart) */
export async function putAvatar(file) {
  if (!(file instanceof File)) throw new Error("Arquivo inválido para upload.");
  const form = new FormData();
  form.append("file", file);

  // NÃO defina Content-Type manualmente (deixe o browser setar o boundary)
  const r = await api.put("/api/v1/app/me/avatar", form, withTenant({
    headers: { /* 'Content-Type': undefined */ },
    transformRequest: v => v, // impede serialização indevida do FormData em alguns setups
  }));

  return typeof r.data === "string" ? { message: r.data } : (r.data || {});
}

/** DELETE /api/v1/app/me/avatar */
export async function deleteAvatar() {
  await api.delete("/api/v1/app/me/avatar", withTenant());
  return {};
}

/** GET /api/v1/app/me/avatar -> Blob (imagem) */
export async function getAvatarBlobUrl() {
  const r = await api.get("/api/v1/app/me/avatar", {
    ...withTenant(),
    responseType: "blob",
  });
  const blob = r.data;
  if (!(blob instanceof Blob)) return null;
  return URL.createObjectURL(blob);
}
