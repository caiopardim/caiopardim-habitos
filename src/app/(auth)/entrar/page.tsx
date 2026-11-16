"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authErrorMessage } from "@/components/auth/auth-messages";
import { GoogleButton } from "@/components/auth/google-button";
import { loginSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function EntrarPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword(parsed.data);
    if (error) {
      setError(authErrorMessage(error.message));
      setLoading(false);
      return;
    }
    router.replace("/hoje");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/recuperar-senha"
              className="text-muted-foreground text-xs underline-offset-4 hover:underline"
            >
              Esqueci a senha
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" /> ou <span className="bg-border h-px flex-1" />
      </div>
      <GoogleButton />
      <p className="text-muted-foreground text-center text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-foreground font-semibold underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
