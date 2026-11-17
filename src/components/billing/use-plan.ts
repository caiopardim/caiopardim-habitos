"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useReadyData } from "@/components/providers/app-data";
import { BILLING_ENABLED } from "@/lib/config";
import { assinaturaPreview, getPlanoPreview, subscribePlanoPreview } from "@/lib/demo/plan-preview";
import { entitlement, periodoLiberado, podeAdicionarHabito, type Assinatura } from "@/lib/domain/billing";

/**
 * Plano da pessoa. Sem cobrança ligada, fora do modo conta ou sem a tabela de assinaturas,
 * `controlado` é false e tudo fica liberado. Na demonstração, mostra o plano escolhido em
 * "Ver como" (só visual).
 */
export function usePlan() {
  const { snapshot, repoKind } = useReadyData();
  const preview = useSyncExternalStore(subscribePlanoPreview, getPlanoPreview, () => "premium" as const);

  const assinatura: Assinatura | null = useMemo(() => {
    if (repoKind === "demo") return assinaturaPreview(preview, new Date());
    if (BILLING_ENABLED && repoKind === "supabase") return snapshot.billing?.assinatura ?? null;
    return null;
  }, [repoKind, preview, snapshot.billing]);

  const direito = useMemo(() => entitlement(assinatura, new Date()), [assinatura]);
  const ativos = snapshot.habits.filter((h) => !h.arquivado).length;
  return {
    controlado: assinatura !== null,
    direito,
    assinatura,
    pagamentos: repoKind === "supabase" ? (snapshot.billing?.pagamentos ?? []) : [],
    podeAdicionarHabito: podeAdicionarHabito(direito, ativos),
    periodoLiberado: (dias: number) => periodoLiberado(direito, dias),
  };
}
