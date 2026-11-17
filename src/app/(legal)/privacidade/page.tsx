import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Política de privacidade</h1>
        <p className="text-muted-foreground text-sm">Vigente desde {LEGAL.vigencia}</p>
      </header>

      <p>
        A Zoryka é um app para acompanhar hábitos e a sua evolução. Esta política explica, em linguagem
        direta, quais dados tratamos, para quê, com quem e por quanto tempo — conforme a Lei Geral de Proteção
        de Dados (Lei 13.709/2018, LGPD).
      </p>

      <h2>1. Quem é o responsável</h2>
      <p>
        O controlador dos dados é {LEGAL.razaoSocial} ({LEGAL.documento}), {LEGAL.endereco}. Encarregado pelo
        tratamento de dados (DPO): {LEGAL.encarregado} —{" "}
        <a className="underline" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>
        .
      </p>

      <h2>2. Quais dados tratamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail e senha (guardada só como hash pelo nosso provedor de
          autenticação). No login com Google, recebemos nome e e-mail da sua conta Google.
        </li>
        <li>
          <strong>O que você registra no app:</strong> hábitos, metas, registros diários, tarefas, áreas da
          vida, objetivo, preferências e conquistas. Esses registros podem revelar informações sobre sua saúde
          e seus hábitos (por exemplo, sono, atividade física, consumo de álcool ou cigarro) — que a LGPD
          trata como <strong>dados pessoais sensíveis</strong>.
        </li>
        <li>
          <strong>Lembretes:</strong> se você ativar as notificações, guardamos o endereço técnico do aparelho
          que o navegador gera para recebê-las.
        </li>
        <li>
          <strong>Dados técnicos:</strong> registros de acesso (data, hora e IP), exigidos pelo Marco Civil da
          Internet; relatórios de erro sem dados de identificação direta; e, só se você permitir, medições
          anônimas de uso.
        </li>
      </ul>
      <p>
        No <strong>modo demonstração</strong> e no <strong>modo local</strong>, os dados ficam apenas no seu
        navegador: nada é enviado aos nossos servidores.
      </p>

      <h2>3. Para que usamos e com qual base legal</h2>
      <ul>
        <li>Criar sua conta e fazer o app funcionar — execução do contrato (art. 7º, V).</li>
        <li>
          Tratar os registros que podem envolver saúde — com o seu <strong>consentimento específico</strong>,
          dado no cadastro (art. 11, I). Sem ele não é possível usar a conta.
        </li>
        <li>
          Enviar lembretes — consentimento, que você dá e retira nas configurações do app e do aparelho.
        </li>
        <li>
          Corrigir erros e manter a segurança — legítimo interesse (art. 7º, IX), sem dados de identificação
          direta.
        </li>
        <li>
          Medir o uso para melhorar o app — consentimento, pedido em um aviso e revogável a qualquer momento.
        </li>
        <li>Guardar registros de acesso — obrigação legal (art. 7º, II; Marco Civil, art. 15).</li>
      </ul>
      <p>
        Não vendemos seus dados, não usamos seus registros para publicidade e não tomamos decisões
        automatizadas que afetem seus direitos.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <p>
        Apenas com fornecedores que operam o serviço por nossa conta, sob contrato e com segurança adequada:
      </p>
      <ul>
        <li>Supabase — banco de dados e autenticação;</li>
        <li>Vercel — hospedagem do app;</li>
        <li>Sentry — relatórios de erro;</li>
        <li>PostHog (servidores na União Europeia) — medições de uso, só com seu consentimento;</li>
        <li>
          Serviços de notificação do seu navegador (Google, Apple ou Mozilla) — recebem apenas a notificação
          criptografada;
        </li>
        <li>
          Quando houver planos pagos, o processador de pagamento escolhido, só com os dados da cobrança.
        </li>
      </ul>
      <p>
        Alguns desses fornecedores mantêm servidores fora do Brasil. Nesses casos, a transferência
        internacional segue o art. 33 da LGPD, com garantias contratuais de proteção.
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <ul>
        <li>Seus dados ficam guardados enquanto a conta existir.</li>
        <li>
          Ao excluir a conta (Configurações → Excluir minha conta), ela e todos os seus registros são apagados
          na hora da base principal; cópias de segurança são sobrescritas no ciclo normal do fornecedor, em
          até 30 dias.
        </li>
        <li>Registros de acesso: 6 meses, como exige o Marco Civil da Internet.</li>
      </ul>

      <h2>6. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e acessá-los;</li>
        <li>corrigir dados incompletos ou desatualizados (no próprio app);</li>
        <li>
          levar seus dados para outro serviço — <strong>Configurações → Seus dados → CSV ou JSON</strong>;
        </li>
        <li>
          excluir seus dados — <strong>Configurações → Excluir minha conta</strong>;
        </li>
        <li>revogar consentimentos (lembretes e medições de uso) nas configurações;</li>
        <li>saber com quem compartilhamos e pedir anonimização ou bloqueio de dados desnecessários;</li>
        <li>reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
      </ul>
      <p>
        Para qualquer pedido, escreva para{" "}
        <a className="underline" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>
        . Respondemos em até 15 dias.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Usamos conexão criptografada (HTTPS), controle de acesso no banco de dados para que cada pessoa só
        veja os próprios registros, senhas guardadas só como hash e chaves secretas apenas nos servidores.
        Nenhum sistema é 100% invulnerável; se houver um incidente que traga risco a você, avisaremos você e a
        ANPD.
      </p>

      <h2>8. Armazenamento no aparelho</h2>
      <p>
        Guardamos no seu navegador o necessário para o app funcionar: sessão de login, preferências (como o
        tema) e uma cópia dos seus dados para usar sem internet. Medições de uso só são ativadas com o seu
        consentimento.
      </p>

      <h2>9. Crianças e adolescentes</h2>
      <p>
        A Zoryka é destinada a maiores de 18 anos. Menores só podem usar com o consentimento e acompanhamento
        de um responsável legal (art. 14).
      </p>

      <h2>10. Saúde</h2>
      <p>
        A Zoryka é uma ferramenta de organização pessoal e{" "}
        <strong>não substitui acompanhamento médico ou psicológico</strong>. Se você está passando por um
        momento difícil, o CVV atende de graça, 24 horas, pelo telefone 188 ou em cvv.org.br.
      </p>

      <h2>11. Mudanças nesta política</h2>
      <p>
        Se esta política mudar de forma relevante, avisaremos no app antes de a mudança valer. Versão{" "}
        {LEGAL.versao}.
      </p>
    </>
  );
}
