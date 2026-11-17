import { createClient } from "./client";

/** Ações de autenticação da conta (fora do Repository porque não são dados do app). */
export async function currentEmail(): Promise<string | null> {
  const { data } = await createClient().auth.getUser();
  return data.user?.email ?? null;
}

/** Envia confirmação para o novo e-mail; a troca vale depois do clique no link. */
export async function changeEmail(email: string) {
  const { error } = await createClient().auth.updateUser(
    { email },
    { emailRedirectTo: `${window.location.origin}/auth/callback?next=/configuracoes` },
  );
  if (error) throw error;
}

export async function changePassword(password: string) {
  const { error } = await createClient().auth.updateUser({ password });
  if (error) throw error;
}
