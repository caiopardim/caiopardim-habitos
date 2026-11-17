import { z } from "zod";

export const emailSchema = z.string().trim().email("Informe um e-mail válido.");
export const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.");

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Informe a senha.") });
export const signupSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome.").max(60),
  email: emailSchema,
  password: passwordSchema,
  // checkbox do formulário: "on" quando marcado
  aceite: z.literal("on", { message: "Para criar a conta, aceite os termos e a política de privacidade." }),
});
