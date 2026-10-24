/** Scrub secrets / tokens from log messages before console output (L2). */
export function scrubLogMessage(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [redacted]")
    .replace(/access_token[=:]\s*["']?[^"'&\s]+/gi, "access_token=[redacted]")
    .replace(/refresh_token[=:]\s*["']?[^"'&\s]+/gi, "refresh_token=[redacted]")
    .replace(/client_secret[=:]\s*["']?[^"'&\s]+/gi, "client_secret=[redacted]")
    .replace(/password[=:]\s*["']?[^"'&\s]+/gi, "password=[redacted]")
    .replace(/enc:v1:[A-Za-z0-9+/=]+/g, "enc:v1:[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[jwt-redacted]");
}

export function safeLogError(label: string, error: unknown) {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown error";
  console.error(label, scrubLogMessage(raw));
}
