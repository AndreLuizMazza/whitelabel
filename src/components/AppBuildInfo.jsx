import {
  APP_BUILD_ISO,
  formatAppBuildDateTime,
  formatAppBuildLabel,
  getAppVersionLabel,
} from "@/lib/appVersion.js";

/**
 * Exibe versão e timestamp do build gerados automaticamente no prebuild.
 * @param {"full"|"compact"|"version"} variant
 */
export default function AppBuildInfo({
  variant = "full",
  className = "",
  as = "p",
}) {
  const Tag = as;

  if (variant === "version") {
    return (
      <Tag className={className} title={`Build ${APP_BUILD_ISO}`}>
        {getAppVersionLabel()}
      </Tag>
    );
  }

  if (variant === "compact") {
    return (
      <Tag className={className} title={APP_BUILD_ISO}>
        {getAppVersionLabel()} · {formatAppBuildDateTime()}
      </Tag>
    );
  }

  return (
    <Tag className={className} title={APP_BUILD_ISO}>
      {formatAppBuildLabel()}
    </Tag>
  );
}
