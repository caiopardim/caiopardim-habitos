"use client";

import Link from "next/link";
import { useState } from "react";
import { authErrorMessage } from "@/components/auth/auth-messages";
import { emailSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/redefinir-senha`,
    });
    setLoading(false);
    if (error) return setError(authErrorMessage(error.message));
    setSent(true);
  }

  return (
    <div className="space-y-5">
      {sent ? (
        <p className="bg-card rounded-xl border p-5 text-center text-sm">
          Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <p className="text-muted-foreground text-sm">
            Informe seu e-mail e enviaremos um link para redefinir a senha.
          </p>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </Button>
        </form>
      )}
      <p className="text-center text-sm">
        <Link href="/entrar" className="text-muted-foreground underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
