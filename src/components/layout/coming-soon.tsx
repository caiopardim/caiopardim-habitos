export function ComingSoon({ fase, itens }: { fase: string; itens: string[] }) {
  return (
    <div className="rounded-xl border border-dashed p-5">
      <p className="text-sm font-semibold">Chega na {fase}</p>
      <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
        {itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
