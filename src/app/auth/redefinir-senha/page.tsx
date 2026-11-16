"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authErrorMessage } from "@/components/auth/auth-messages";
import { passwordSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(new FormData(e.currentTarget).get("password"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password: parsed.data });
    setLoading(false);
    if (error) return setError(authErrorMessage(error.message));
    toast.success("Senha atualizada!");
    router.replace("/hoje");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-5">
      <h1 className="text-xl font-bold">Criar nova senha</h1>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          Salvar nova senha
        </Button>
      </form>
    </main>
  );
}
