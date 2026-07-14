import type { AuthUser } from "./auth";
import type { PortalSettings } from "./settings";

export function getUserDisplayName(
  user?: AuthUser | null,
  mode: PortalSettings["topbarUserDisplayMode"] = "FULL_NAME",
) {
  if (!user) return "کاربر";

  if (mode === "PERSONNEL_CODE") {
    return user.personnelCode || user.username;
  }

  if (mode === "USERNAME") {
    return user.username;
  }

  return (
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.directoryUser?.displayName ||
    user.personnelCode ||
    user.username
  );
}
