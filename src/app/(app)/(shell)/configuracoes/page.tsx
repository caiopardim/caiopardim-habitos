"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Download, LogOut, Mail, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authErrorMessage } from "@/components/auth/auth-messages";
import { emailSchema, passwordSchema } from "@/components/auth/schemas";
import { usePlan } from "@/components/billing/use-plan";
import { PageHeader } from "@/components/layout/page-header";
import { InstallSettings } from "@/components/settings/install-settings";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import { RemindersSettings } from "@/components/settings/reminders-settings";
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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Segmented } from "@/components/ui/segmented";
import { downloadFile, snapshotToCsv, snapshotToJson } from "@/lib/data/export";
import { track } from "@/lib/analytics";
import { getPlanoPreview, setPlanoPreview, subscribePlanoPreview } from "@/lib/demo/plan-preview";
import { PLANO_LABEL } from "@/lib/domain/billing";
import { changeEmail, changePassword, currentEmail } from "@/lib/supabase/account";
import { timezoneOptions } from "@/lib/timezones";

const CONFIRMACAO = "EXCLUIR";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">{titulo}</h2>
      <div className="bg-card space-y-4 rounded-xl border p-4">{children}</div>
    </section>
  );
}

export default function ConfiguracoesPage() {
  const { snapshot, today, updateProfile, signOut, deleteAccount, repoKind } = useReadyData();
  const { theme, setTheme } = useTheme();
  const p = snapshot.profile;
  const conta = repoKind === "supabase";
  const plano = usePlan();
  const planoPreview = useSyncExternalStore(subscribePlanoPreview, getPlanoPreview, () => "premium" as const);
  const [nome, setNome] = useState(p.nome);
  const [email, setEmail] = useState<string | null>(null);
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [excluirAberto, setExcluirAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (conta) void currentEmail().then(setEmail);
  }, [conta]);

  const exportar = (formato: "csv" | "json") => {
    const nomeArquivo = `zoryka-${today}.${formato}`;
    if (formato === "csv") downloadFile(nomeArquivo, snapshotToCsv(snapshot), "text/csv;charset=utf-8");
    else downloadFile(nomeArquivo, snapshotToJson(snapshot), "application/json");
    track("dados_exportados", { formato });
    toast.success("Arquivo exportado.");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" />

      <Secao titulo="Perfil">
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
      </Secao>

      {plano.controlado && (
        <Secao titulo="Plano">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              <strong>{PLANO_LABEL[plano.direito.plano]}</strong>
              {plano.direito.ate && (
                <span className="text-muted-foreground">
                  {" "}
                  até {new Date(plano.direito.ate).toLocaleDateString("pt-BR")}
                </span>
              )}
            </p>
            <Button variant="secondary" asChild>
              <Link href="/assinatura">Minha assinatura</Link>
            </Button>
          </div>
        </Secao>
      )}

      <Secao titulo="Lembretes">
        <RemindersSettings />
      </Secao>

      <Secao titulo="App">
        <InstallSettings />
      </Secao>

      <Secao titulo="Privacidade">
        <PrivacySettings />
      </Secao>

      {conta && (
        <Secao titulo="Conta">
          <p className="text-sm">
            <span className="text-muted-foreground">E-mail: </span>
            <strong>{email ?? "…"}</strong>
          </p>
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = emailSchema.safeParse(novoEmail);
              if (!r.success) return toast.error(r.error.issues[0].message);
              setOcupado(true);
              try {
                await changeEmail(r.data);
                toast.success("Enviamos um link para o novo e-mail. A troca vale depois que você confirmar.");
                setNovoEmail("");
              } catch (err) {
                toast.error(authErrorMessage(err instanceof Error ? err.message : ""));
              } finally {
                setOcupado(false);
              }
            }}
          >
            <Field id="novo-email" label="Trocar e-mail">
              <div className="flex gap-2">
                <Input
                  id="novo-email"
                  type="email"
                  autoComplete="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="novo@email.com"
                />
                <Button type="submit" variant="secondary" disabled={ocupado || !novoEmail}>
                  <Mail /> Trocar
                </Button>
              </div>
            </Field>
          </form>
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = passwordSchema.safeParse(novaSenha);
              if (!r.success) return toast.error(r.error.issues[0].message);
              setOcupado(true);
              try {
                await changePassword(r.data);
                toast.success("Senha atualizada.");
                setNovaSenha("");
              } catch (err) {
                toast.error(authErrorMessage(err instanceof Error ? err.message : ""));
              } finally {
                setOcupado(false);
              }
            }}
          >
            <Field id="nova-senha" label="Trocar senha" hint="Mínimo de 8 caracteres.">
              <div className="flex gap-2">
                <Input
                  id="nova-senha"
                  type="password"
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
                <Button type="submit" variant="secondary" disabled={ocupado || !novaSenha}>
                  <KeyRound /> Trocar
                </Button>
              </div>
            </Field>
          </form>
        </Secao>
      )}

      {repoKind === "demo" && (
        <Secao titulo="Demonstração">
          <p className="text-muted-foreground text-sm">
            Você está vendo dados fictícios. Nada do que você marcar aqui vai para uma conta.
          </p>
          <Field label="Ver o app como">
            <Segmented
              label="Ver o app como"
              value={planoPreview}
              onChange={setPlanoPreview}
              options={[
                { value: "premium", label: "Premium" },
                { value: "teste", label: "Teste" },
                { value: "gratis", label: "Grátis" },
              ]}
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="sm:flex-1">
              <Link href="/cadastro">Criar minha conta</Link>
            </Button>
            <Button variant="outline" className="sm:flex-1" onClick={() => void signOut()}>
              Sair da demonstração
            </Button>
          </div>
        </Secao>
      )}

      {repoKind === "local" && (
        <Secao titulo="Modo local">
          <p className="text-muted-foreground text-sm">
            Seus dados estão salvos só neste navegador. Exporte de vez em quando para não perder nada.
          </p>
        </Secao>
      )}

      <Secao titulo="Seus dados">
        <p className="text-muted-foreground text-sm">
          Baixe tudo o que você registrou: CSV abre no Excel e no Google Planilhas; JSON é a cópia completa.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => exportar("csv")}>
            <Download /> CSV
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => exportar("json")}>
            <Download /> JSON
          </Button>
        </div>
        {repoKind !== "demo" && (
          <Button
            variant="ghost"
            className="text-danger w-full"
            onClick={() => {
              setConfirmacao("");
              setExcluirAberto(true);
            }}
          >
            <Trash2 /> {conta ? "Excluir minha conta" : "Apagar todos os dados deste navegador"}
          </Button>
        )}
      </Secao>

      {conta && (
        <Button variant="outline" className="w-full" onClick={() => void signOut()}>
          <LogOut /> Sair
        </Button>
      )}
      <p className="text-muted-foreground text-center text-xs">
        A Zoryka não substitui acompanhamento médico ou psicológico. Precisa conversar? CVV: 188 (gratuito,
        24h).
      </p>

      <Dialog open={excluirAberto} onOpenChange={setExcluirAberto}>
        <DialogContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (confirmacao.trim().toUpperCase() !== CONFIRMACAO) return;
              setOcupado(true);
              try {
                await deleteAccount();
              } catch (err) {
                console.error(err);
                toast.error("Não foi possível excluir agora. Tente novamente em instantes.");
                setOcupado(false);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{conta ? "Excluir sua conta?" : "Apagar todos os dados?"}</DialogTitle>
              <DialogDescription>
                {conta
                  ? "Sua conta e todos os seus hábitos, registros e conquistas serão apagados para sempre. Isso não pode ser desfeito. Se houver renovação automática no cartão, ela é cancelada."
                  : "Todos os hábitos e registros salvos neste navegador serão apagados. Isso não pode ser desfeito."}{" "}
                Se quiser guardar uma cópia, exporte seus dados antes.
              </DialogDescription>
            </DialogHeader>
            <Field id="confirmacao" label={`Para confirmar, digite ${CONFIRMACAO}`}>
              <Input
                id="confirmacao"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setExcluirAberto(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={ocupado || confirmacao.trim().toUpperCase() !== CONFIRMACAO}
              >
                {conta ? "Excluir conta" : "Apagar dados"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
