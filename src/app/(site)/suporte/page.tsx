import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { SuggestionForm } from "@/components/support/suggestion-form";
import { Button } from "@/components/ui/button";
import { BILLING_ENABLED } from "@/lib/config";
import { mailtoLink, SUPORTE, whatsappLink } from "@/lib/support";

export const metadata: Metadata = {
  title: "Suporte",
  description: "Fale com a equipe da Zoryka por e-mail ou WhatsApp e envie suas sugestões.",
  alternates: { canonical: "/suporte" },
};

const AJUDA: [string, React.ReactNode][] = [
  [
    "Esqueci minha senha",
    <>
      Use{" "}
      <Link href="/recuperar-senha" className="text-xp underline underline-offset-4">
        recuperar senha
      </Link>
      : enviamos um link para o seu e-mail.
    </>,
  ],
  [
    "Como instalo no celular?",
    "Em Configurações → App. No Android, toque em Instalar; no iPhone, abra no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.",
  ],
  [
    "Os lembretes não chegam",
    "Confira em Configurações → Lembretes se as notificações estão ativas neste aparelho e se o horário de silêncio não cobre o horário do lembrete. No iPhone, os lembretes só funcionam com o app instalado na tela inicial.",
  ],
  [
    "Como exporto ou apago meus dados?",
    "Em Configurações → Seus dados: exporte em CSV ou JSON, ou exclua a conta (isso apaga tudo para sempre).",
  ],
];
if (BILLING_ENABLED) {
  AJUDA.push([
    "Como cancelo ou peço reembolso?",
    "Em Configurações → Plano → Minha assinatura você cancela a renovação com um toque. Reembolso integral em até 7 dias após o pagamento: fale com a gente por um dos canais acima.",
  ]);
}

export default function SuportePage() {
  const temCanal = SUPORTE.email || SUPORTE.whatsapp;
  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Suporte</h1>
        <p className="text-muted-foreground">Dúvida, problema ou ideia? Estamos aqui.</p>
      </header>

      <section aria-labelledby="contato" className="bg-card space-y-4 rounded-2xl border p-5">
        <h2 id="contato" className="text-lg font-bold">
          Fale com a gente
        </h2>
        {temCanal ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              {SUPORTE.whatsapp && (
                <Button asChild className="sm:flex-1">
                  <a href={whatsappLink(SUPORTE.whatsapp)} target="_blank" rel="noreferrer">
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
              )}
              {SUPORTE.email && (
                <Button asChild variant="outline" className="sm:flex-1">
                  <a href={mailtoLink(SUPORTE.email, "Suporte Zoryka")}>
                    <Mail /> {SUPORTE.email}
                  </a>
                </Button>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="size-4 shrink-0" aria-hidden />
              Atendimento: {SUPORTE.horario}. Respondemos em até 1 dia útil.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">[a preencher: e-mail e WhatsApp de atendimento]</p>
        )}
      </section>

      <section aria-labelledby="ajuda" className="space-y-3">
        <h2 id="ajuda" className="text-lg font-bold">
          Respostas rápidas
        </h2>
        <div className="divide-y rounded-2xl border">
          {AJUDA.map(([p, r]) => (
            <details key={p} className="group px-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
                {p}
                <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-muted-foreground pb-4 text-sm">{r}</p>
            </details>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          Mais respostas nas{" "}
          <Link href="/#faq" className="text-xp underline underline-offset-4">
            dúvidas frequentes
          </Link>
          .
        </p>
      </section>

      <section
        id="sugestoes"
        aria-labelledby="sugestoes-t"
        className="bg-card scroll-mt-20 space-y-4 rounded-2xl border p-5"
      >
        <div>
          <h2 id="sugestoes-t" className="text-lg font-bold">
            Sugestões
          </h2>
          <p className="text-muted-foreground text-sm">
            Cada mensagem é lida. As melhores ideias viram{" "}
            <Link href="/novidades" className="text-xp underline underline-offset-4">
              novidades
            </Link>
            .
          </p>
        </div>
        <SuggestionForm />
      </section>
    </div>
  );
}
