import { Navigate } from "react-router-dom";
import { getTenantContract, isAboutPageVisible } from "@/lib/tenantContent";

export default function TenantAboutGate({ children }) {
  const t = getTenantContract();
  if (!isAboutPageVisible(t)) return <Navigate to="/" replace />;
  return children;
}
