import * as Sentry from "@sentry/electron/main";

export function initMainSentry() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV || process.env.NODE_ENV || "production",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  });
}
