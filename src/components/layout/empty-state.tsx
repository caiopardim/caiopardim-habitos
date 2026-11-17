import { ZorykaMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** Estado vazio: ilustração + título + texto + ação. */
export function EmptyState({
  title,
  children,
  action,
  illustration,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center",
        className,
      )}
    >
      {illustration ?? <ZorykaMark className="text-muted-foreground/60 h-12 w-auto opacity-80" />}
      <div className="space-y-1">
        <p className="font-display font-semibold">{title}</p>
        {children && <p className="text-muted-foreground mx-auto max-w-xs text-sm">{children}</p>}
      </div>
      {action}
    </div>
  );
}
