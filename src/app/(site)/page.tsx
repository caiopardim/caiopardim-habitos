import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Check,
  Download,
  Medal,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  WifiOff,
} from "lucide-react";
import { DemoVideo } from "@/components/landing/demo-video";
import { LandingRedirect } from "@/components/landing/landing-redirect";
import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME, BILLING_ENABLED, isSupabaseConfigured } from "@/lib/config";
import {
  economiaAnual,
  formatBRL,
  LIMITES_GRATIS,
  mensalEquivalenteAnual,
  PRECOS,
} from "@/lib/domain/billing";
import { DEPOIMENTOS } from "@/lib/landing/depoimentos";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME} · hábitos, metas e evolução pessoal` },
  description: APP_DESCRIPTION,
  alternates: { canonical: "/" },
};

const COMECAR = isSupabaseConfigured ? "/cadastro" : "/hoje";

const RECURSOS = [
  {
    icone: Target,
    titulo: "Missões do dia",
    texto: "Hábitos e tarefas num lugar só. Marque com um toque e ganhe XP pelo que importa.",
  },
  {
    icone: Swords,
    titulo: "Hábitos a evitar",
    texto: "Conte os dias sem o que te atrapalha. Escorregou? Sem drama: seu recorde continua seu.",
  },
  {
    icone: BarChart3,
    titulo: "Evolução em dados",
    texto: "Gráficos, revisão da semana e insights sobre quando você vai melhor.",
  },
  {
    icone: Sparkles,
    titulo: "Um avatar que evolui",
    texto: "Sete estágios: ele fica mais forte conforme você mantém a constância.",
  },
  {
    icone: Medal,
    titulo: "Medalhas e temporadas",
    texto: "25 conquistas e desafios semanais que sobem de nível com você.",
  },
  {
    icone: Bell,
    titulo: "Lembretes na hora certa",
    texto: "Avisos por hábito e no fechamento do dia, com horário de silêncio.",
  },
  {
    icone: WifiOff,
    titulo: "Funciona sem internet",
    texto: "Instale na tela inicial. Marcou offline? Sincroniza quando a conexão voltar.",
  },
  {
    icone: Download,
    titulo: "Seus dados são seus",
    texto: "Exporte tudo em CSV ou JSON e exclua a conta quando quiser.",
  },
];

const PASSOS = [
  ["Escolha suas áreas e hábitos", "Em 2 minutos: saúde, mente, trabalho, relações. Comece com poucos."],
  ["Faça o check-in do dia", "Marque as missões, registre o que evitou e veja a execução subir."],
  ["Revise e ajuste", "Toda semana, a Zoryka mostra o que funcionou e o que vale mudar."],
];

function faq(): [string, string][] {
  const base: [string, string][] = [
    [
      "O que é a Zoryka?",
      "Um app para acompanhar hábitos, tarefas e o que você quer evitar, com pontuação do dia, sequência, gráficos de evolução e um avatar que evolui com você.",
    ],
    [
      "Preciso baixar numa loja de aplicativos?",
      "Não. A Zoryka funciona no navegador do celular ou do computador e pode ser instalada na tela inicial (Android e iPhone), abrindo como um app, inclusive sem internet.",
    ],
    [
      "E se eu falhar um dia?",
      "Acontece. Você tem um dia de descanso por semana que não quebra a sequência, e o app foca no seu progresso, não na culpa.",
    ],
    [
      "Quem vê os meus hábitos?",
      "Só você. Os dados ficam protegidos por regras de acesso no banco, seguimos a LGPD e você pode exportar ou apagar tudo a qualquer momento nas Configurações.",
    ],
    [
      "A Zoryka substitui terapia ou acompanhamento médico?",
      "Não. Ela ajuda a organizar a rotina, mas não substitui profissionais de saúde. Se precisar conversar, o CVV atende de graça, 24h, no 188.",
    ],
  ];
  if (!BILLING_ENABLED) {
    base.splice(1, 0, ["É grátis?", "Sim. Durante o lançamento, todos os recursos estão liberados."]);
    return base;
  }
  base.splice(
    1,
    0,
    [
      "É grátis?",
      `Sim: o plano grátis tem até ${LIMITES_GRATIS.habitosAtivos} hábitos ativos e a Evolução dos últimos ${LIMITES_GRATIS.evolucaoDias} dias, para sempre. Ao criar a conta, você ganha 7 dias do Premium para testar, sem cartão.`,
    ],
    [
      "Como pago e como cancelo?",
      `Pelo Mercado Pago, com Pix ou cartão (o anual em até 12x). O mensal no cartão renova sozinho e você cancela em Minha assinatura com um toque; o Premium continua até o fim do período pago.`,
    ],
    [
      "E se eu não gostar?",
      "Até 7 dias depois do pagamento, você pede o reembolso integral (direito de arrependimento). E se o Premium vencer, nada do que você registrou se perde.",
    ],
  );
  return base;
}

function Secao({
  id,
  titulo,
  subtitulo,
  children,
}: {
  id: string;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14">
      <h2 id={`${id}-t`} className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {titulo}
      </h2>
      {subtitulo && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitulo}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Celular({ src, alt, prioridade }: { src: string; alt: string; prioridade?: boolean }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={1298}
      priority={prioridade}
      sizes="(min-width: 768px) 260px, 70vw"
      className="bg-card w-full rounded-[1.75rem] border-[6px] border-[var(--brand-track)] shadow-2xl"
    />
  );
}

function Preco({
  nome,
  preco,
  detalhe,
  itens,
  destaque,
  selo,
}: {
  nome: string;
  preco: string;
  detalhe: string;
  itens: string[];
  destaque?: boolean;
  selo?: string;
}) {
  return (
    <div
      className={
        destaque
          ? "bg-card border-primary/70 relative flex flex-col gap-4 rounded-2xl border-2 p-6"
          : "bg-card relative flex flex-col gap-4 rounded-2xl border p-6"
      }
    >
      {selo && (
        <span className="bg-brand-gradient text-primary-foreground absolute -top-3 right-5 rounded-full px-3 py-1 text-xs font-bold">
          {selo}
        </span>
      )}
      <div>
        <h3 className="font-bold">{nome}</h3>
        <p className="mt-1 text-3xl font-bold tabular-nums">{preco}</p>
        <p className="text-muted-foreground text-sm">{detalhe}</p>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {itens.map((i) => (
          <li key={i} className="flex gap-2">
            <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> {i}
          </li>
        ))}
      </ul>
      <Button asChild variant={destaque ? "default" : "outline"}>
        <Link href={COMECAR}>{destaque ? "Testar 7 dias grátis" : "Começar grátis"}</Link>
      </Button>
    </div>
  );
}

export default function Inicio() {
  const premium = [
    "Hábitos ilimitados",
    "Evolução de qualquer período",
    "Insights e calendário do ano",
    "Temporadas semanais",
  ];
  return (
    <>
      <LandingRedirect />

      {/* Proposta */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-brand-gradient pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 pt-12 pb-14 md:grid-cols-[1.2fr_1fr] md:pt-20">
          <div className="space-y-6">
            <p className="text-xp text-sm font-semibold tracking-wide uppercase">
              Hábitos · metas · evolução
            </p>
            <h1 className="font-display text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
              Sua evolução, <span className="text-brand-gradient">um dia de cada vez.</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-lg">
              A {APP_NAME} transforma seus hábitos em missões diárias, mostra seu progresso em dados e
              comemora cada passo — sem culpa quando um dia não sai como o planejado.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href={COMECAR}>Começar grátis</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">Ver demonstração</Link>
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              {BILLING_ENABLED ? "7 dias de Premium grátis, sem cartão." : "Grátis durante o lançamento."}{" "}
              Funciona no celular e no computador.
            </p>
          </div>
          <div className="mx-auto w-[min(72vw,280px)]">
            <Celular
              src="/landing/hoje.webp"
              alt="Tela Hoje da Zoryka com o anel de execução do dia, a sequência e o XP"
              prioridade
            />
          </div>
        </div>
      </section>

      <Secao id="como-funciona" titulo="Como funciona" subtitulo="Registre → revise → aprenda → ajuste.">
        <ol className="grid gap-4 md:grid-cols-3">
          {PASSOS.map(([t, d], i) => (
            <li key={t} className="bg-card rounded-2xl border p-5">
              <span className="bg-brand-gradient text-primary-foreground grid size-9 place-items-center rounded-full font-bold">
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{d}</p>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao
        id="por-dentro"
        titulo="Veja por dentro"
        subtitulo="Imagens e vídeo reais do app, com os dados fictícios da demonstração."
      >
        <div
          tabIndex={0}
          role="region"
          aria-label="Telas do app (role para o lado)"
          className="focus-visible:ring-ring/50 -mx-4 flex snap-x snap-mandatory [scrollbar-width:thin] gap-5 overflow-x-auto px-4 pb-4 focus-visible:ring-[3px] focus-visible:outline-none md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0"
        >
          <figure className="w-[70vw] max-w-[260px] shrink-0 snap-center space-y-3 md:w-auto md:max-w-none">
            <DemoVideo className="bg-card w-full rounded-[1.75rem] border-[6px] border-[var(--brand-track)] shadow-2xl" />
            <figcaption className="text-muted-foreground text-center text-sm">
              Check-in em segundos
            </figcaption>
          </figure>
          <figure className="w-[70vw] max-w-[260px] shrink-0 snap-center space-y-3 md:w-auto md:max-w-none">
            <Celular
              src="/landing/evolucao.webp"
              alt="Tela Evolução com média da pontuação, dias registrados e revisão da semana"
            />
            <figcaption className="text-muted-foreground text-center text-sm">
              Sua evolução em dados
            </figcaption>
          </figure>
          <figure className="w-[70vw] max-w-[260px] shrink-0 snap-center space-y-3 md:w-auto md:max-w-none">
            <Celular
              src="/landing/perfil.webp"
              alt="Tela Perfil com o avatar no estágio Determinado e a próxima evolução"
            />
            <figcaption className="text-muted-foreground text-center text-sm">
              Um avatar que evolui com você
            </figcaption>
          </figure>
        </div>
      </Secao>

      <Secao id="recursos" titulo="Tudo o que você precisa para manter a constância">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="bg-card rounded-2xl border p-5">
              <Icone className="text-primary size-6" aria-hidden />
              <h3 className="mt-3 font-bold">{titulo}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{texto}</p>
            </li>
          ))}
        </ul>
      </Secao>

      {DEPOIMENTOS.length > 0 && (
        <Secao id="depoimentos" titulo="Quem usa, conta">
          <ul className="grid gap-4 md:grid-cols-3">
            {DEPOIMENTOS.map((d) => (
              <li key={d.nome} className="bg-card space-y-4 rounded-2xl border p-5">
                <blockquote className="text-sm">“{d.texto}”</blockquote>
                <div className="flex items-center gap-3">
                  {d.foto && (
                    <Image
                      src={d.foto}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover"
                    />
                  )}
                  <p className="text-sm">
                    <strong>{d.nome}</strong>
                    <span className="text-muted-foreground block text-xs">{d.contexto}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Secao
        id="precos"
        titulo="Preços"
        subtitulo={
          BILLING_ENABLED
            ? "Comece grátis. Se fizer sentido, o Premium custa menos que um café por semana."
            : "Durante o lançamento, tudo é grátis."
        }
      >
        {BILLING_ENABLED ? (
          <div className="grid gap-5 md:grid-cols-3">
            <Preco
              nome="Grátis"
              preco="R$ 0"
              detalhe="para sempre"
              itens={[
                `Até ${LIMITES_GRATIS.habitosAtivos} hábitos ativos`,
                "Check-in, tarefas, XP, avatar e medalhas",
                "Lembretes",
                `Evolução dos últimos ${LIMITES_GRATIS.evolucaoDias} dias`,
              ]}
            />
            <Preco
              nome="Premium anual"
              preco={formatBRL(PRECOS.anual)}
              detalhe={`por ano · equivale a ${formatBRL(mensalEquivalenteAnual())}/mês · Pix ou até 12x`}
              itens={premium}
              destaque
              selo={`Economize ${economiaAnual()}%`}
            />
            <Preco
              nome="Premium mensal"
              preco={formatBRL(PRECOS.mensal)}
              detalhe="por mês · cartão (cancele quando quiser) ou Pix"
              itens={premium}
            />
          </div>
        ) : (
          <div className="bg-card max-w-md space-y-4 rounded-2xl border p-6">
            <p className="text-3xl font-bold">R$ 0</p>
            <ul className="space-y-2 text-sm">
              {["Todos os recursos liberados", ...premium.slice(0, 3), "Lembretes e modo offline"].map(
                (i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> {i}
                  </li>
                ),
              )}
            </ul>
            <Button asChild className="w-full">
              <Link href={COMECAR}>Começar grátis</Link>
            </Button>
          </div>
        )}
        {BILLING_ENABLED && (
          <div className="bg-card mt-6 flex items-start gap-3 rounded-2xl border p-5 text-sm">
            <ShieldCheck className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              <strong>Garantia de 7 dias:</strong>{" "}
              <span className="text-muted-foreground">
                não gostou, devolvemos 100% do valor (direito de arrependimento). Pagamento seguro pelo
                Mercado Pago — a {APP_NAME} não vê nem guarda os dados do seu cartão.
              </span>
            </p>
          </div>
        )}
      </Secao>

      <Secao id="faq" titulo="Dúvidas frequentes">
        <div className="divide-y rounded-2xl border">
          {faq().map(([p, r]) => (
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
        <p className="text-muted-foreground mt-4 text-sm">
          Ficou alguma dúvida?{" "}
          <Link href="/suporte" className="text-xp font-medium underline underline-offset-4">
            Fale com a gente
          </Link>
          .
        </p>
      </Secao>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="bg-card relative overflow-hidden rounded-3xl border p-8 text-center sm:p-12">
          <div aria-hidden className="bg-brand-gradient absolute inset-x-0 top-0 h-1" />
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Comece hoje. Amanhã você agradece.</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg">
            Leva 2 minutos para montar sua rotina e fazer o primeiro check-in.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={COMECAR}>Começar grátis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Ver demonstração</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
