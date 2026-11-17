"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authErrorMessage } from "@/components/auth/auth-messages";
import { GoogleButton } from "@/components/auth/google-button";
import { signupSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    setError(null);
    const { nome, email, password } = parsed.data;
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    setLoading(false);
    if (error) return setError(authErrorMessage(error.message));
    track("cadastro");
    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
    } else {
      setSentTo(email);
    }
  }

  if (sentTo) {
    return (
      <div className="bg-card space-y-3 rounded-xl border p-5 text-center">
        <p className="text-3xl">📬</p>
        <p className="font-semibold">Confirme seu e-mail</p>
        <p className="text-muted-foreground text-sm">
          Enviamos um link para <strong className="text-foreground">{sentTo}</strong>. Abra-o para ativar sua
          conta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" autoComplete="given-name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-muted-foreground text-xs">Mínimo de 8 caracteres.</p>
        </div>
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" /> ou <span className="bg-border h-px flex-1" />
      </div>
      <GoogleButton />
      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-foreground font-semibold underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
