"use client";

import { Progress } from "@/components/ui/progress";
import { AVATAR_STAGES } from "@/lib/domain/avatar";
import { cn } from "@/lib/utils";
import { EvolutionAvatar } from "./evolution-avatar";
import { ENERGIA_TEXTO, useAvatar } from "./use-avatar";

export function AvatarCard() {
  const a = useAvatar();
  return (
    <section aria-labelledby="avatar-titulo" className="bg-card overflow-hidden rounded-xl border">
      <div className="from-primary/10 flex flex-col items-center gap-1 bg-gradient-to-b to-transparent px-4 pt-4 pb-2 text-center">
        <EvolutionAvatar
          estagio={a.estagio}
          energia={a.energia}
          className="size-48"
          title={`Seu avatar: ${a.stage.nome}`}
        />
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Estágio {a.estagio + 1} de {AVATAR_STAGES.length}
        </p>
        <h2 id="avatar-titulo" className="text-2xl font-bold">
          {a.stage.nome}
        </h2>
        <p className="text-muted-foreground text-sm">{a.stage.descricao}</p>
        <p className="mt-1 text-sm">{ENERGIA_TEXTO[a.energia]}</p>
      </div>
      <div className="space-y-2 p-4">
        {a.proximo ? (
          <>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Próxima evolução: {a.proximo.nome}</span>
              <span>Nível {a.proximo.nivelMin}</span>
            </div>
            <Progress
              value={a.progressoProximo * 100}
              indicatorClassName="bg-brand-gradient"
              aria-label={`Progresso até ${a.proximo.nome}`}
            />
          </>
        ) : (
          <p className="text-xp text-center text-sm font-semibold">Evolução máxima alcançada! 👑</p>
        )}
        <ol className="grid grid-cols-7 gap-1 pt-2" aria-label="Estágios do avatar">
          {AVATAR_STAGES.map((st, i) => {
            const alcancado = i <= a.estagio;
            return (
              <li key={st.nome} className="flex flex-col items-center gap-0.5">
                <EvolutionAvatar
                  estagio={i}
                  energia="normal"
                  locked={!alcancado}
                  className={cn("size-full max-w-14", i === a.estagio && "bg-primary/15 rounded-lg")}
                  title={alcancado ? st.nome : `${st.nome} — bloqueado até o nível ${st.nivelMin}`}
                />
                <span
                  className={cn(
                    "text-[10px] leading-tight",
                    alcancado ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  Nv {st.nivelMin}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
