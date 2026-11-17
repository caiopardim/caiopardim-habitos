import { loadSentry } from "@/lib/monitoring";

// Inicia o monitoramento de erros no navegador (não faz nada sem NEXT_PUBLIC_SENTRY_DSN).
void loadSentry();
