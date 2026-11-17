"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, HeartHandshake } from "lucide-react";
import { EvolutionAvatar } from "@/components/avatar/evolution-avatar";
import { useAppData } from "@/components/providers/app-data";
import { AvoidItem } from "@/components/today/avoid-item";
import { HabitMission } from "@/components/today/mission-item";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_TIMEZONE } from "@/lib/config";
import { habitProgress } from "@/lib/domain/day";
import { isValidTimeZone, todayInTz } from "@/lib/domain/dates";
import { areasFromTemplates, habitFromBadTemplate, habitFromGoodTemplate } from "@/lib/habit-factory";
import { haptic } from "@/lib/haptic";
import {
  AREAS,
  BAD_HABIT_TEMPLATES,
  DIFICULDADE_LABEL,
  GOOD_HABIT_TEMPLATES,
  OBJETIVOS,
  ONBOARDING_MAX_BONS,
  ONBOARDING_MAX_MAUS,
} from "@/lib/templates";
import { TIMEZONES, timezoneOptions } from "@/lib/timezones";
import { formatNumber } from "@/lib/utils";

const STEPS = ["Seu objetivo", "Áreas da vida", "Hábitos iniciais", "Lembrete", "Primeiro check-in"];

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
  const data = useAppData();
  const { snapshot, setupOnboarding, finishOnboarding, repoKind, logFor } = data;
  // Recarregou depois de criar os hábitos? Retoma no primeiro check-in (sem duplicar nada).
  const [step, setStep] = useState(() => ((snapshot?.habits.length ?? 0) > 0 ? 4 : 0));
  const [nome, setNome] = useState(snapshot?.profile.nome ?? "");
  const [fuso, setFuso] = useState(detectTimezone);
  const [mudarFuso, setMudarFuso] = useState(false);
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [areas, setAreas] = useState<Set<string>>(() => new Set());
  const [bons, setBons] = useState<Set<string>>(() => new Set());
  const [maus, setMaus] = useState<Set<string>>(() => new Set());
  const [querLembrete, setQuerLembrete] = useState(true);
  const [horario, setHorario] = useState("21:00");
  const [saving, setSaving] = useState(false);

  const escolherObjetivo = (chave: string) => {
    const o = OBJETIVOS.find((x) => x.chave === chave)!;
    setObjetivo(chave);
    setAreas(new Set(o.areas));
    setBons(new Set(o.bons.slice(0, 3)));
    setMaus(new Set(o.maus.slice(0, 1)));
  };

  // Sugestões do objetivo e das áreas em foco aparecem primeiro.
  const sugeridos = new Set(OBJETIVOS.find((o) => o.chave === objetivo)?.bons ?? []);
  const goodSorted = useMemo(
    () =>
      [...GOOD_HABIT_TEMPLATES].sort(
        (a, b) =>
          Number(sugeridos.has(b.chave)) * 2 +
          Number(areas.has(b.area)) -
          (Number(sugeridos.has(a.chave)) * 2 + Number(areas.has(a.area))),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areas, objetivo],
  );
  const badSorted = useMemo(
    () => [...BAD_HABIT_TEMPLATES].sort((a, b) => Number(areas.has(b.area)) - Number(areas.has(a.area))),
    [areas],
  );

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string, max = Infinity) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else if (next.size < max) next.add(key);
    setter(next);
  };

  /** Etapa 4 → 5: grava perfil, áreas e hábitos para o primeiro check-in. */
  async function salvar() {
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
    await setupOnboarding({
      nome: nome.trim(),
      fuso,
      objetivo,
      lembreteHorario: querLembrete ? horario : null,
      areas: lifeAreas,
      habits,
    });
    setSaving(false);
    setStep(4);
  }

  async function concluir() {
    setSaving(true);
    await finishOnboarding();
    router.replace("/hoje");
  }

  const today = todayInTz(fuso);
  const criados = snapshot?.habits ?? [];
  const feitosHoje = criados.filter((h) =>
    h.tipo === "bom" ? habitProgress(h, logFor(h.id, today)) > 0 : logFor(h.id, today)?.status === "evitei",
  ).length;

  const canNext = [
    nome.trim().length > 0 && objetivo !== null,
    areas.size > 0,
    bons.size + maus.size > 0,
    true,
  ][step];
  const fusoLabel = TIMEZONES.find((t) => t.value === fuso)?.label ?? fuso.replaceAll("_", " ");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-6">
      <div className="mb-6 flex items-center gap-3">
        {step > 0 && step < 4 ? (
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
          <Progress value={((step + 1) / STEPS.length) * 100} aria-label="Progresso do onboarding" />
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <section className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Boas-vindas! 👋</h1>
              <p className="text-muted-foreground mt-1">
                Sua evolução, um dia de cada vez. Vamos montar seu começo em menos de 1 minuto.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Como podemos te chamar?</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} />
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Qual é o seu objetivo principal agora?</legend>
              <div className="grid gap-2">
                {OBJETIVOS.map((o) => (
                  <Chip
                    key={o.chave}
                    selected={objetivo === o.chave}
                    onClick={() => escolherObjetivo(o.chave)}
                  >
                    <span className="text-xl" aria-hidden>
                      {o.emoji}
                    </span>
                    <span className="text-foreground">{o.titulo}</span>
                  </Chip>
                ))}
              </div>
            </fieldset>
            {mudarFuso ? (
              <div className="space-y-2">
                <Label htmlFor="fuso">Fuso horário</Label>
                <NativeSelect id="fuso" value={fuso} onChange={(e) => setFuso(e.target.value)}>
                  {timezoneOptions(fuso).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Fuso horário: {fusoLabel} ·{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => setMudarFuso(true)}
                >
                  alterar
                </button>
              </p>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold">Quais áreas da vida você quer cuidar?</h1>
              <p className="text-muted-foreground mt-1">Já marcamos as do seu objetivo. Ajuste à vontade.</p>
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
                Quem começa com 3 a 5 hábitos tem mais chance de continuar. Você adiciona outros depois.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-muted-foreground flex justify-between text-sm font-semibold">
                Para fazer
                <span aria-live="polite">
                  {bons.size} de {ONBOARDING_MAX_BONS}
                </span>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {goodSorted.map((t) => {
                  const sel = bons.has(t.chave);
                  return (
                    <Chip
                      key={t.chave}
                      selected={sel}
                      disabled={!sel && bons.size >= ONBOARDING_MAX_BONS}
                      className="disabled:opacity-40"
                      onClick={() => toggle(bons, setBons, t.chave, ONBOARDING_MAX_BONS)}
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
                          {sugeridos.has(t.chave) && " · sugerido"}
                        </span>
                      </span>
                    </Chip>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-muted-foreground flex justify-between text-sm font-semibold">
                Para evitar
                <span aria-live="polite">
                  {maus.size} de {ONBOARDING_MAX_MAUS}
                </span>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {badSorted.map((t) => {
                  const sel = maus.has(t.chave);
                  return (
                    <Chip
                      key={t.chave}
                      selected={sel}
                      disabled={!sel && maus.size >= ONBOARDING_MAX_MAUS}
                      className="disabled:opacity-40"
                      onClick={() => toggle(maus, setMaus, t.chave, ONBOARDING_MAX_MAUS)}
                    >
                      <span className="text-xl" aria-hidden>
                        {t.emoji}
                      </span>
                      <span className="text-foreground">{t.nome}</span>
                    </Chip>
                  );
                })}
              </div>
              <p className="bg-muted flex gap-2 rounded-lg p-3 text-xs leading-relaxed">
                <HeartHandshake className="text-primary size-4 shrink-0" aria-hidden />
                <span>
                  A Zoryka não substitui acompanhamento médico ou psicológico. Se estiver difícil, procure
                  ajuda: o{" "}
                  <a
                    href="https://cvv.org.br"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    CVV
                  </a>{" "}
                  atende de graça, 24h, pelo telefone <strong>188</strong>.
                </span>
              </p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Qual o melhor horário para fechar o dia?</h1>
              <p className="text-muted-foreground mt-1">
                Nesse horário vamos te lembrar de registrar o que fez. As notificações são ativadas depois do
                seu primeiro dia — você decide.
              </p>
            </div>
            <div className="bg-card flex items-center justify-between gap-3 rounded-xl border p-4">
              <Label htmlFor="quer-lembrete" className="flex items-center gap-2">
                <BellRing className="text-primary size-5" aria-hidden />
                Quero um lembrete diário
              </Label>
              <Switch id="quer-lembrete" checked={querLembrete} onCheckedChange={setQuerLembrete} />
            </div>
            {querLembrete && (
              <div className="space-y-2">
                <Label htmlFor="horario">Horário</Label>
                <Input
                  id="horario"
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value || "21:00")}
                  className="text-lg"
                />
              </div>
            )}
          </section>
        )}

        {step === 4 && (
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <EvolutionAvatar
                estagio={0}
                energia={feitosHoje > 0 ? "energizado" : "normal"}
                className="size-20 shrink-0"
                title="Seu avatar"
              />
              <div>
                <h1 className="text-2xl font-bold">
                  {feitosHoje > 0 ? "Primeiro passo dado! 🎉" : "Vamos dar o primeiro passo?"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {feitosHoje > 0
                    ? "Seu avatar já ganhou XP. A cada hábito cumprido ele fica mais forte."
                    : "Marque algo que você já fez hoje — mesmo que seja pouco. Este é o seu avatar: ele cresce com você."}
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {criados
                .filter((h) => h.tipo === "bom")
                .map((h) => (
                  <HabitMission
                    key={h.id}
                    habit={h}
                    log={logFor(h.id, today)}
                    editable
                    onCheck={(done) => {
                      if (done) haptic();
                      data.setCheck(h, today, done);
                    }}
                    onQuantity={(v) => data.setQuantity(h, today, v)}
                  />
                ))}
              {criados
                .filter((h) => h.tipo === "mau")
                .map((h) => (
                  <AvoidItem
                    key={h.id}
                    habit={h}
                    log={logFor(h.id, today)}
                    logs={[]}
                    date={today}
                    editable
                    onSet={(st) => data.setBadStatus(h, today, st)}
                  />
                ))}
            </ul>
          </section>
        )}
      </div>

      {/* Ações fixas no rodapé: sempre ao alcance do polegar, mesmo com listas longas. */}
      <div className="bg-background/95 sticky bottom-0 mt-8 space-y-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        {step < 3 && (
          <Button className="w-full" size="lg" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Continuar
          </Button>
        )}
        {step === 3 && (
          <Button className="w-full" size="lg" disabled={saving} onClick={() => void salvar()}>
            {saving ? "Preparando…" : "Continuar"}
          </Button>
        )}
        {step === 4 && (
          <>
            <Button
              className="w-full"
              size="lg"
              disabled={saving || feitosHoje === 0}
              onClick={() => void concluir()}
            >
              Ir para Hoje
            </Button>
            {feitosHoje === 0 && (
              <Button variant="ghost" className="w-full" disabled={saving} onClick={() => void concluir()}>
                Ainda não fiz nada hoje — pular
              </Button>
            )}
          </>
        )}
        {repoKind !== "demo" && step === 0 && (
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/demo">Só quero ver uma demonstração</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
