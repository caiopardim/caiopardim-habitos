"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { track } from "@/lib/analytics";
import { mailtoLink, SUPORTE, whatsappLink } from "@/lib/support";

type Tipo = "ideia" | "problema" | "elogio";
const MAX = 1000;

/**
 * Envia uma sugestão. Com conta, vai para o banco; sem conta (modo local, demonstração ou
 * visitante), oferece e-mail ou WhatsApp com o texto já preenchido.
 */
export function SuggestionForm({ onEnviada }: { onEnviada?: () => void }) {
  const [tipo, setTipo] = useState<Tipo>("ideia");
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [semConta, setSemConta] = useState(false);

  const assunto = `Zoryka: ${tipo === "problema" ? "problema" : tipo === "elogio" ? "elogio" : "sugestão"}`;

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (texto.trim().length < 5) return toast.error("Escreva pelo menos 5 caracteres.");
        setOcupado(true);
        try {
          const r = await fetch("/api/sugestoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo, texto, pagina: window.location.pathname.slice(0, 100) }),
          });
          if (r.status === 401 || r.status === 404) {
            setSemConta(true);
            return;
          }
          const j = (await r.json().catch(() => ({}))) as { erro?: string };
          if (!r.ok) return toast.error(j.erro ?? "Não foi possível enviar agora.");
          track("sugestao_enviada", { tipo });
          toast.success("Recebemos! Obrigado por ajudar a Zoryka a melhorar.");
          setTexto("");
          onEnviada?.();
        } catch {
          toast.error("Sem conexão. Tente de novo quando a internet voltar.");
        } finally {
          setOcupado(false);
        }
      }}
    >
      <Segmented
        label="Tipo de mensagem"
        value={tipo}
        onChange={setTipo}
        className="w-full [&>*]:flex-1"
        options={[
          { value: "ideia", label: "Ideia" },
          { value: "problema", label: "Problema" },
          { value: "elogio", label: "Elogio" },
        ]}
      />
      <div className="space-y-1">
        <label htmlFor="sugestao" className="text-sm font-medium">
          {tipo === "problema"
            ? "O que aconteceu?"
            : tipo === "elogio"
              ? "O que você curtiu?"
              : "Qual é a sua ideia?"}
        </label>
        <textarea
          id="sugestao"
          value={texto}
          maxLength={MAX}
          rows={4}
          onChange={(e) => {
            setTexto(e.target.value);
            setSemConta(false);
          }}
          placeholder={
            tipo === "problema" ? "Conte o que você fez e o que apareceu na tela." : "Escreva do seu jeito."
          }
          className="border-input focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-base focus-visible:ring-[3px] focus-visible:outline-none md:text-sm"
        />
        <p className="text-muted-foreground text-right text-xs tabular-nums">
          {texto.length}/{MAX}
        </p>
      </div>
      {semConta ? (
        <div className="bg-muted space-y-2 rounded-lg p-3 text-sm" role="status">
          <p>Sem uma conta, envie por um destes canais (o texto vai junto):</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {SUPORTE.email && (
              <Button asChild variant="secondary" className="sm:flex-1">
                <a href={`${mailtoLink(SUPORTE.email, assunto)}&body=${encodeURIComponent(texto)}`}>E-mail</a>
              </Button>
            )}
            {SUPORTE.whatsapp && (
              <Button asChild variant="secondary" className="sm:flex-1">
                <a
                  href={whatsappLink(SUPORTE.whatsapp, `${assunto}\n\n${texto}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
            )}
            {!SUPORTE.email && !SUPORTE.whatsapp && (
              <p className="text-muted-foreground">Os canais de contato ainda não foram configurados.</p>
            )}
          </div>
        </div>
      ) : (
        <Button type="submit" className="w-full" disabled={ocupado}>
          <Send /> {ocupado ? "Enviando…" : "Enviar"}
        </Button>
      )}
    </form>
  );
}
