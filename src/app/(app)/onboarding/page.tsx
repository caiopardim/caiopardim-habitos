"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { APP_NAME, DEFAULT_TIMEZONE } from "@/lib/config";
import { isValidTimeZone, todayInTz } from "@/lib/domain/dates";
import { areasFromTemplates, habitFromBadTemplate, habitFromGoodTemplate } from "@/lib/habit-factory";
import { AREAS, BAD_HABIT_TEMPLATES, DIFICULDADE_LABEL, GOOD_HABIT_TEMPLATES } from "@/lib/templates";
import { timezoneOptions } from "@/lib/timezones";
import { formatNumber } from "@/lib/utils";

const STEPS = ["Sobre você", "Áreas da vida", "Hábitos iniciais", "Tudo pronto"];

function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { snapshot, completeOnboarding, loadDemo, repoKind } = useAppData();
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState(snapshot?.profile.nome ?? "");
  const [fuso, setFuso] = useState(detectTimezone);
  const [areas, setAreas] = useState<Set<string>>(() => new Set(["saude", "mente"]));
  const [bons, setBons] = useState<Set<string>>(() => new Set(["agua", "ler"]));
  const [maus, setMaus] = useState<Set<string>>(() => new Set(["redes"]));
  const [saving, setSaving] = useState(false);

  // Modelos das áreas em foco aparecem primeiro.
  const goodSorted = useMemo(
    () => [...GOOD_HABIT_TEMPLATES].sort((a, b) => Number(areas.has(b.area)) - Number(areas.has(a.area))),
    [areas],
  );
  const badSorted = useMemo(
    () => [...BAD_HABIT_TEMPLATES].sort((a, b) => Number(areas.has(b.area)) - Number(areas.has(a.area))),
    [areas],
  );

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  async function finish() {
    setSaving(true);
    const today = todayInTz(fuso);
    const lifeAreas = areasFromTemplates(areas);
    const habits = [
      ...GOOD_HABIT_TEMPLATES.filter((t) => bons.has(t.chave)).map((t) =>
        habitFromGoodTemplate(t, lifeAreas, today),
      ),
      ...BAD_HABIT_TEMPLATES.filter((t) => maus.has(t.chave)).map((t) =>
        habitFromBadTemplate(t, lifeAreas, today),
      ),
    ];
    await completeOnboarding({ nome: nome.trim(), fuso, areas: lifeAreas, habits });
    router.replace("/hoje");
  }

  const canNext = step !== 0 || nome.trim().length > 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mb-6 flex items-center gap-3">
        {step > 0 ? (
          <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => setStep(step - 1)}>
            <ArrowLeft />
          </Button>
        ) : (
          <span className="size-11" />
        )}
        <div className="flex-1 space-y-1.5">
          <p className="text-muted-foreground text-xs">
            Etapa {step + 1} de {STEPS.length} · {STEPS[step]}
          </p>
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <section className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Boas-vindas ao {APP_NAME} 👋</h1>
              <p className="text-muted-foreground mt-1">
                Vamos transformar sua rotina em dados para aprender e ajustar — sem perfeccionismo.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Como podemos te chamar?</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={60}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuso">Fuso horário</Label>
              <NativeSelect id="fuso" value={fuso} onChange={(e) => setFuso(e.target.value)}>
                {timezoneOptions(fuso).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-muted-foreground text-xs">Seu dia vira à meia-noite deste fuso.</p>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Quais áreas da vida você quer cuidar agora?</h1>
              <p className="text-muted-foreground mt-1">Escolha quantas quiser. Dá para mudar depois.</p>
            </div>
            <div className="grid gap-2">
              {AREAS.map((a) => (
                <Chip
                  key={a.chave}
                  selected={areas.has(a.chave)}
                  onClick={() => toggle(areas, setAreas, a.chave)}
                >
                  <span className="text-xl" aria-hidden>
                    {a.emoji}
                  </span>
                  <span className="size-2.5 rounded-full" style={{ background: a.cor }} aria-hidden />
                  {a.nome}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Comece com poucos hábitos</h1>
              <p className="text-muted-foreground mt-1">
                2 a 4 é um ótimo começo. Você pode ajustar metas depois.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-muted-foreground text-sm font-semibold">Para fazer</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {goodSorted.map((t) => (
                  <Chip
                    key={t.chave}
                    selected={bons.has(t.chave)}
                    onClick={() => toggle(bons, setBons, t.chave)}
                  >
                    <span className="text-xl" aria-hidden>
                      {t.emoji}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-foreground">{t.nome}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {t.metaTipo === "quantidade"
                          ? `${formatNumber(t.metaValor ?? 0)} ${t.unidade}`
                          : "Feito / não feito"}{" "}
                        · {DIFICULDADE_LABEL[t.dificuldade]}
                      </span>
                    </span>
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-muted-foreground text-sm font-semibold">Para evitar</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {badSorted.map((t) => (
                  <Chip
                    key={t.chave}
                    selected={maus.has(t.chave)}
                    onClick={() => toggle(maus, setMaus, t.chave)}
                  >
                    <span className="text-xl" aria-hidden>
                      {t.emoji}
                    </span>
                    <span className="text-foreground">{t.nome}</span>
                  </Chip>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5 text-center">
            <p className="pt-6 text-6xl">🚀</p>
            <h1 className="text-2xl font-bold">Tudo pronto{nome.trim() ? `, ${nome.trim()}` : ""}!</h1>
            <p className="text-muted-foreground">
              Você vai começar com <strong className="text-foreground">{bons.size}</strong>{" "}
              {bons.size === 1 ? "hábito" : "hábitos"} para fazer e{" "}
              <strong className="text-foreground">{maus.size}</strong> para evitar.
            </p>
            <p className="text-muted-foreground mx-auto max-w-sm text-sm">
              Lembre: um dia ruim é uma queda no gráfico, não um recomeço do zero. O que importa é a
              constância.
            </p>
            <p className="text-muted-foreground mx-auto max-w-sm text-xs">
              O {APP_NAME} não substitui acompanhamento profissional de saúde.
            </p>
          </section>
        )}
      </div>

      <div className="mt-8 space-y-2">
        {step < 3 ? (
          <Button className="w-full" size="lg" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Continuar
          </Button>
        ) : (
          <Button className="w-full" size="lg" disabled={saving} onClick={() => void finish()}>
            {saving ? "Preparando…" : "Ir para Hoje"}
          </Button>
        )}
        {repoKind === "local" && step === 0 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={async () => {
              await loadDemo();
              router.replace("/hoje");
            }}
          >
            Pular e carregar 60 dias de exemplo
          </Button>
        )}
      </div>
    </main>
  );
}
