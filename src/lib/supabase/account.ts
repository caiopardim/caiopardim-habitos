/** Cliente carregado sob demanda (só quando a pessoa usa uma destas ações). */
const client = async () => (await import("./client")).createClient();

/** Ações de autenticação da conta (fora do Repository porque não são dados do app). */
export async function currentEmail(): Promise<string | null> {
  const { data } = await (await client()).auth.getUser();
  return data.user?.email ?? null;
}

/** Envia confirmação para o novo e-mail; a troca vale depois do clique no link. */
export async function changeEmail(email: string) {
  const { error } = await (
    await client()
  ).auth.updateUser(
    { email },
    { emailRedirectTo: `${window.location.origin}/auth/callback?next=/configuracoes` },
  );
  if (error) throw error;
}

export async function changePassword(password: string) {
  const { error } = await (await client()).auth.updateUser({ password });
  if (error) throw error;
}
