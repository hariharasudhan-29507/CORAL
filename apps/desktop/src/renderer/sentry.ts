import * as Sentry from "@sentry/electron/renderer";

export function initRendererSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  if (!(window as typeof window & { coral?: unknown }).coral) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });
}
