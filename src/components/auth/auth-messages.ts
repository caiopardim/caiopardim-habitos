/** Traduz as mensagens de erro mais comuns do Supabase Auth. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("already registered")) return "Este e-mail já tem cadastro. Tente entrar.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Algo deu errado. Tente novamente.";
}
