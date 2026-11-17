import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Termos de uso</h1>
        <p className="text-muted-foreground text-sm">Vigentes desde {LEGAL.vigencia}</p>
      </header>

      <p>
        Estes termos regem o uso da Zoryka, oferecida por {LEGAL.razaoSocial} ({LEGAL.documento}). Ao criar
        uma conta, você concorda com eles e com a{" "}
        <Link href="/privacidade" className="underline">
          Política de privacidade
        </Link>
        .
      </p>

      <h2>1. O que é a Zoryka</h2>
      <p>
        Um app para registrar hábitos, acompanhar sua evolução com gráficos e gamificação e receber lembretes.
        As funcionalidades podem evoluir com o tempo.
      </p>

      <h2>2. Não é um serviço de saúde</h2>
      <p>
        As informações e sugestões do app são de organização pessoal. A Zoryka{" "}
        <strong>não substitui acompanhamento médico, psicológico ou nutricional</strong> e não deve ser usada
        em situações de emergência. Em caso de sofrimento emocional, procure ajuda profissional ou o CVV
        (188).
      </p>

      <h2>3. Sua conta</h2>
      <ul>
        <li>Você deve ter 18 anos ou mais, ou usar com o consentimento de um responsável legal.</li>
        <li>Mantenha sua senha em segurança; você é responsável pelo que for feito com a sua conta.</li>
        <li>Você pode excluir sua conta a qualquer momento nas configurações do app.</li>
      </ul>

      <h2>4. Uso aceitável</h2>
      <p>
        Não é permitido tentar acessar dados de outras pessoas, sobrecarregar ou atacar o serviço, fazer
        engenharia reversa para burlar limites, nem usar o app para fins ilegais. Podemos suspender contas que
        violem estes termos, avisando você sempre que possível.
      </p>

      <h2>5. Seus dados e seu conteúdo</h2>
      <p>
        Tudo o que você registra continua sendo seu. Usamos esses dados só para fazer o app funcionar,
        conforme a Política de privacidade, e você pode exportá-los ou excluí-los quando quiser.
      </p>

      <h2>6. Planos pagos</h2>
      <p>
        Se houver planos pagos, preço, período de teste, renovação e cancelamento serão informados com clareza
        antes da contratação. Você poderá cancelar pelo próprio app, e o direito de arrependimento de 7 dias
        do Código de Defesa do Consumidor (art. 49) será respeitado.
      </p>

      <h2>7. Disponibilidade</h2>
      <p>
        Trabalhamos para manter o app disponível e seus dados seguros, mas podem ocorrer interrupções para
        manutenção ou por falhas de terceiros. Recomendamos exportar seus dados periodicamente.
      </p>

      <h2>8. Responsabilidade</h2>
      <p>
        Respondemos pelos danos que causarmos nos termos da lei, inclusive do Código de Defesa do Consumidor.
        Não respondemos por decisões tomadas com base nas informações do app em substituição a orientação
        profissional.
      </p>

      <h2>9. Propriedade intelectual</h2>
      <p>A marca Zoryka, o design, o código e os conteúdos do app pertencem ao responsável pelo app.</p>

      <h2>10. Mudanças nos termos</h2>
      <p>
        Avisaremos no app sobre mudanças relevantes antes de elas valerem. Se não concordar, você pode
        exportar seus dados e excluir a conta.
      </p>

      <h2>11. Lei e foro</h2>
      <p>
        Estes termos seguem a lei brasileira. Fica eleito o foro do domicílio do consumidor; não sendo
        consumidor, o foro de {LEGAL.foro}. Contato:{" "}
        <a className="underline" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>
        . Versão {LEGAL.versao}.
      </p>
    </>
  );
}
