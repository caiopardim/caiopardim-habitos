"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Segmented } from "@/components/ui/segmented";
import { timezoneOptions } from "@/lib/timezones";

export default function ConfiguracoesPage() {
  const { snapshot, updateProfile, signOut, loadDemo, repoKind } = useReadyData();
  const { theme, setTheme } = useTheme();
  const p = snapshot.profile;
  const [nome, setNome] = useState(p.nome);

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" />

      <section className="bg-card space-y-4 rounded-xl border p-4">
        <Field id="nome" label="Nome">
          <div className="flex gap-2">
            <Input id="nome" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} />
            <Button
              variant="secondary"
              disabled={!nome.trim() || nome.trim() === p.nome}
              onClick={async () => {
                await updateProfile({ nome: nome.trim() });
                toast.success("Nome atualizado.");
              }}
            >
              Salvar
            </Button>
          </div>
        </Field>
        <Field id="fuso" label="Fuso horário" hint="Define quando o seu dia vira.">
          <NativeSelect
            id="fuso"
            value={p.fuso}
            onChange={(e) => void updateProfile({ fuso: e.target.value })}
          >
            {timezoneOptions(p.fuso).map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Tema">
          <Segmented
            label="Tema"
            value={theme === "light" ? "light" : "dark"}
            onChange={setTheme}
            options={[
              { value: "dark", label: "Escuro" },
              { value: "light", label: "Claro" },
            ]}
          />
        </Field>
        <Field
          id="limite"
          label={`Execução mínima para contar na sequência: ${Math.round(p.limiteSequencia * 100)}%`}
          hint="Um dia conta como “seguido” quando você cumpre pelo menos essa parte do previsto."
        >
          <input
            id="limite"
            type="range"
            min={30}
            max={100}
            step={5}
            value={Math.round(p.limiteSequencia * 100)}
            onChange={(e) => void updateProfile({ limiteSequencia: Number(e.target.value) / 100 })}
            className="h-11 w-full accent-[var(--primary)]"
          />
        </Field>
      </section>

      {repoKind === "local" && (
        <section className="bg-card space-y-3 rounded-xl border p-4">
          <p className="text-sm font-semibold">Modo demonstração</p>
          <p className="text-muted-foreground text-sm">
            Substitui seus dados locais por 60 dias de histórico de exemplo.
          </p>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!window.confirm("Substituir os dados deste navegador pelo exemplo?")) return;
              await loadDemo();
              toast.success("Dados de exemplo carregados.");
            }}
          >
            Carregar dados de exemplo
          </Button>
        </section>
      )}

      <section className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            if (
              repoKind === "local" &&
              !window.confirm("No modo demonstração, sair apaga os dados deste navegador. Continuar?")
            )
              return;
            await signOut();
          }}
        >
          <LogOut /> {repoKind === "local" ? "Sair e apagar dados locais" : "Sair"}
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Este app não substitui acompanhamento profissional de saúde.
        </p>
      </section>
    </div>
  );
}
