"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Minus, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { iniciarCheckout, type Forma } from "@/components/billing/checkout";
import { usePlan } from "@/components/billing/use-plan";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { BILLING_ENABLED } from "@/lib/config";
import {
  economiaAnual,
  formatBRL,
  LIMITES_GRATIS,
  mensalEquivalenteAnual,
  PLANO_LABEL,
  PRECOS,
  type Ciclo,
} from "@/lib/domain/billing";
import { LEGAL } from "@/lib/legal";

const COMPARACAO: { recurso: string; gratis: string | boolean; premium: string | boolean }[] = [
  { recurso: "Hábitos ativos", gratis: `até ${LIMITES_GRATIS.habitosAtivos}`, premium: "ilimitados" },
  { recurso: "Check-in, tarefas, XP e avatar", gratis: true, premium: true },
  { recurso: "Medalhas e sequência", gratis: true, premium: true },
  { recurso: "Lembretes", gratis: true, premium: true },
  { recurso: "Evolução", gratis: `${LIMITES_GRATIS.evolucaoDias} dias`, premium: "qualquer período" },
  { recurso: "Insights e calendário do ano", gratis: false, premium: true },
  { recurso: "Temporadas semanais", gratis: false, premium: true },
  { recurso: "Exportar seus dados", gratis: true, premium: true },
];

function Celula({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="text-success mx-auto size-4" aria-label="incluído" />;
  if (v === false)
    return <Minus className="text-muted-foreground mx-auto size-4" aria-label="não incluído" />;
  return <span>{v}</span>;
}

export default function PlanosPage() {
  const { repoKind } = useReadyData();
  const { controlado, direito } = usePlan();
  const [ciclo, setCiclo] = useState<Ciclo>("anual");
  const [ocupado, setOcupado] = useState<Forma | null>(null);
  const podeComprar = BILLING_ENABLED && repoKind === "supabase";

  const comprar = async (forma: Forma) => {
    setOcupado(forma);
    const erro = await iniciarCheckout(ciclo, forma);
    if (erro) {
      toast.error(erro);
      setOcupado(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Planos" subtitle="Evolua sem limites" />

      {controlado && (
        <p className="bg-card rounded-xl border p-3 text-sm">
          Seu plano agora: <strong>{PLANO_LABEL[direito.plano]}</strong>
          {direito.plano !== "gratis" && direito.ate
            ? ` até ${new Date(direito.ate).toLocaleDateString("pt-BR")}`
            : ""}
          .{" "}
          <Link href="/assinatura" className="text-xp font-medium underline-offset-4 hover:underline">
            Minha assinatura
          </Link>
        </p>
      )}

      <Segmented
        label="Ciclo de cobrança"
        value={ciclo}
        onChange={setCiclo}
        className="w-full [&>*]:flex-1"
        options={[
          { value: "anual", label: `Anual · −${economiaAnual()}%` },
          { value: "mensal", label: "Mensal" },
        ]}
      />

      <section
        aria-labelledby="premium"
        className="bg-card border-primary/60 relative space-y-4 rounded-xl border-2 p-5"
      >
        {ciclo === "anual" && (
          <span className="bg-brand-gradient text-primary-foreground absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-bold">
            Economize {economiaAnual()}%
          </span>
        )}
        <div>
          <h2 id="premium" className="text-lg font-bold">
            Zoryka Premium
          </h2>
          <p className="mt-1">
            <span className="text-3xl font-bold tabular-nums">{formatBRL(PRECOS[ciclo])}</span>
            <span className="text-muted-foreground"> / {ciclo === "anual" ? "ano" : "mês"}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            {ciclo === "anual"
              ? `Equivale a ${formatBRL(mensalEquivalenteAnual())} por mês. Pix ou cartão em até 12x.`
              : "Cartão com renovação automática ou Pix para 30 dias."}
          </p>
        </div>

        {podeComprar ? (
          <div className="flex flex-col gap-2">
            {ciclo === "anual" ? (
              <Button size="lg" disabled={ocupado !== null} onClick={() => void comprar("avulso")}>
                <QrCode /> {ocupado ? "Abrindo o pagamento…" : "Assinar com Pix ou cartão"}
              </Button>
            ) : (
              <>
                <Button size="lg" disabled={ocupado !== null} onClick={() => void comprar("recorrente")}>
                  <CreditCard /> {ocupado === "recorrente" ? "Abrindo o pagamento…" : "Assinar no cartão"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  disabled={ocupado !== null}
                  onClick={() => void comprar("avulso")}
                >
                  <QrCode /> {ocupado === "avulso" ? "Abrindo o pagamento…" : "Pagar 30 dias com Pix"}
                </Button>
              </>
            )}
            <p className="text-muted-foreground text-xs">
              Pagamento seguro pelo Mercado Pago. A Zoryka não vê nem guarda os dados do seu cartão.
              {ciclo === "mensal" && " Cancele a renovação quando quiser, em Minha assinatura."}
            </p>
          </div>
        ) : (
          <div className="bg-muted space-y-3 rounded-lg p-3 text-sm">
            <p>
              {repoKind === "demo"
                ? "Na demonstração não há cobrança. Crie sua conta e ganhe 7 dias de Premium grátis, sem cartão."
                : "Por enquanto todos os recursos estão liberados para você."}
            </p>
            {repoKind === "demo" && (
              <Button asChild className="w-full">
                <Link href="/cadastro">Criar minha conta</Link>
              </Button>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="comparar" className="bg-card overflow-hidden rounded-xl border">
        <h2 id="comparar" className="p-4 pb-2 text-base font-bold">
          Grátis × Premium
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th scope="col" className="px-4 py-2 text-left font-medium">
                Recurso
              </th>
              <th scope="col" className="w-24 py-2 font-medium">
                Grátis
              </th>
              <th scope="col" className="w-28 py-2 pr-2 font-medium">
                Premium
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARACAO.map((l) => (
              <tr key={l.recurso} className="border-t">
                <th scope="row" className="px-4 py-2.5 text-left font-normal">
                  {l.recurso}
                </th>
                <td className="text-center">
                  <Celula v={l.gratis} />
                </td>
                <td className="pr-2 text-center font-medium">
                  <Celula v={l.premium} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-card flex items-start gap-3 rounded-xl border p-4 text-sm">
        <ShieldCheck className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-1">
          <h2 className="font-bold">Arrependeu? Devolvemos tudo</h2>
          <p className="text-muted-foreground">
            Até 7 dias depois do pagamento, você pode pedir o reembolso integral (direito de arrependimento,
            art. 49 do Código de Defesa do Consumidor). Escreva para {LEGAL.email}. Se o Premium vencer, seus
            dados continuam guardados e o plano grátis segue funcionando.
          </p>
        </div>
      </section>
    </div>
  );
}
