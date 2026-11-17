"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelarRenovacao } from "@/components/billing/checkout";
import { usePlan } from "@/components/billing/use-plan";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL, PLANO_LABEL, STATUS_LABEL } from "@/lib/domain/billing";
import { LEGAL } from "@/lib/legal";

const STATUS_PAGAMENTO: Record<string, string> = {
  approved: "Aprovado",
  pending: "Aguardando",
  in_process: "Em análise",
  authorized: "Autorizado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  charged_back: "Contestado",
};
const METODO: Record<string, string> = {
  bank_transfer: "Pix",
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  account_money: "Saldo Mercado Pago",
};

const RETORNO: Record<string, string> = {
  aprovado: "Pagamento aprovado! Estamos liberando o seu Premium…",
  pendente: "Pagamento em processamento. Assim que o Mercado Pago confirmar, o Premium é liberado.",
  cartao: "Assinatura recebida! Assim que a primeira cobrança for aprovada, o Premium é liberado.",
  falhou: "O pagamento não foi concluído. Nada foi cobrado. Você pode tentar de novo.",
};

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export default function AssinaturaPage() {
  const { reload, repoKind } = useReadyData();
  const { controlado, direito, assinatura, pagamentos } = usePlan();
  const [retorno, setRetorno] = useState<string | null>(null);
  const [cancelarAberto, setCancelarAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const premiumAgora = useRef(direito.plano === "premium");
  premiumAgora.current = direito.plano === "premium";

  // Volta do Mercado Pago: o webhook pode levar alguns segundos; recarrega até liberar.
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("retorno");
    if (!r || !(r in RETORNO)) return;
    setRetorno(r);
    window.history.replaceState(null, "", "/assinatura");
    if (r === "falhou") return;
    let tentativas = 0;
    const t = window.setInterval(() => {
      tentativas++;
      if (premiumAgora.current || tentativas > 8) {
        window.clearInterval(t);
        return;
      }
      void reload();
    }, 4000);
    return () => window.clearInterval(t);
  }, [reload]);

  if (!controlado) {
    return (
      <div className="space-y-5">
        <PageHeader title="Minha assinatura" />
        <p className="bg-card rounded-xl border p-4 text-sm">
          {repoKind === "supabase"
            ? "Por enquanto todos os recursos estão liberados para você. Não há nada para pagar."
            : "Assinaturas existem só no modo conta. Aqui tudo está liberado."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Minha assinatura" />

      {retorno && (
        <p
          role="status"
          className={
            retorno === "falhou"
              ? "border-danger/50 rounded-xl border p-3 text-sm"
              : "border-success/50 bg-success/5 flex items-center gap-2 rounded-xl border p-3 text-sm"
          }
        >
          {retorno !== "falhou" && direito.plano !== "premium" && (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          )}
          {direito.plano === "premium" && retorno !== "falhou"
            ? "Premium liberado. Aproveite!"
            : RETORNO[retorno]}
        </p>
      )}

      <section aria-labelledby="plano" className="bg-card space-y-3 rounded-xl border p-4">
        <h2 id="plano" className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Plano atual
        </h2>
        <p className="text-2xl font-bold">{PLANO_LABEL[direito.plano]}</p>
        <p className="text-muted-foreground text-sm">
          {direito.plano === "premium" &&
            direito.ate &&
            `${assinatura?.recorrente ? "Próxima cobrança por volta de" : "Válido até"} ${data(direito.ate)}.`}
          {direito.plano === "teste" &&
            direito.ate &&
            `Teste grátis até ${data(direito.ate)} (${direito.diasRestantes} ${direito.diasRestantes === 1 ? "dia" : "dias"}). Nada será cobrado automaticamente.`}
          {direito.plano === "gratis" && "Até 3 hábitos ativos e Evolução dos últimos 7 dias."}
        </p>
        {assinatura && assinatura.status !== "sem_assinatura" && (
          <p className="text-sm">
            <span className="text-muted-foreground">Cartão: </span>
            {STATUS_LABEL[assinatura.status]}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="sm:flex-1">
            <Link href="/planos">
              {direito.plano === "premium" ? "Renovar ou mudar de plano" : "Ver planos"}
            </Link>
          </Button>
          {assinatura?.recorrente && (
            <Button variant="outline" className="sm:flex-1" onClick={() => setCancelarAberto(true)}>
              Cancelar renovação automática
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby="historico" className="bg-card space-y-3 rounded-xl border p-4">
        <h2 id="historico" className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Pagamentos
        </h2>
        {pagamentos.length ? (
          <ul className="divide-y">
            {pagamentos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">
                    Premium {p.ciclo} · {formatBRL(p.valor)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {data(p.criadoEm)}
                    {p.metodo ? ` · ${METODO[p.metodo] ?? p.metodo}` : ""}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs font-semibold">
                  {STATUS_PAGAMENTO[p.status] ?? p.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Nenhum pagamento ainda.</p>
        )}
        <p className="text-muted-foreground text-xs">
          Reembolso em até 7 dias após o pagamento (direito de arrependimento): escreva para {LEGAL.email}.
        </p>
      </section>

      <Dialog open={cancelarAberto} onOpenChange={setCancelarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar a renovação automática?</DialogTitle>
            <DialogDescription>
              Não haverá novas cobranças no cartão.{" "}
              {direito.plano === "premium" && direito.ate
                ? `Você continua com o Premium até ${data(direito.ate)}. Depois disso, a conta volta ao plano grátis, sem perder nenhum dado.`
                : "Sua conta segue no plano grátis, sem perder nenhum dado."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelarAberto(false)}>
              Manter
            </Button>
            <Button
              variant="destructive"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true);
                const erro = await cancelarRenovacao();
                setOcupado(false);
                if (erro) return toast.error(erro);
                setCancelarAberto(false);
                toast.success("Renovação cancelada.");
                await reload();
              }}
            >
              Cancelar renovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
