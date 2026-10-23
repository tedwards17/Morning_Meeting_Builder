import { t, uiError } from "./i18n";

export const contentPermissionMessage = () => t("Everyone signed in can add content. Administrator and Content Manager accounts manage libraries and edit existing shared content.");

export class ApiError extends Error {
  constructor(message: string, public status: number, public requestId = "") {
    // Only display the server's opaque identifier, never HTML or private diagnostics.
    requestId = /^[a-zA-Z0-9_-]{8,128}$/.test(requestId) ? requestId : "";
    super(requestId ? t("{arg0} Request ID: {arg1}", {arg0:uiError(message),arg1:requestId}) : uiError(message));
    this.requestId = requestId;
    this.name = "ApiError";
  }
}

export function formError(error: unknown): string {
  const issue = (error as {issues?: {path: (string | number)[]; message: string}[]})?.issues?.[0];
  if (issue) return t("Validation: {arg0}", {arg0:t("Check {arg0}: {arg1}", {arg0:issue.path.join(" → ") || t("the form"),arg1:uiError(issue.message)})});
  const message = uiError(error);
  if (error instanceof ApiError) {
    if (error.status === 401) return t("Sign in again before saving. Your entered values are still here.");
    if (error.status === 403) return t("Permission denied: {arg0}", {arg0:message});
    if ([400, 413, 422].includes(error.status)) return t("Validation: {arg0}", {arg0:message});
    if (error.status === 409) return t("Save conflict: {arg0}", {arg0:message});
    return t("Save failed: {arg0}", {arg0:message});
  }
  return t("Check before saving: {arg0}", {arg0:message});
}
