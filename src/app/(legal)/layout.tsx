import Link from "next/link";
import { ZorykaLogo } from "@/components/brand/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8">
      <Link href="/" className="mb-8 inline-flex min-h-11 items-center" aria-label="Zoryka — início">
        <ZorykaLogo markClassName="h-6" />
      </Link>
      <article className="space-y-6 text-[15px] leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </article>
      <footer className="text-muted-foreground mt-12 flex flex-wrap gap-4 border-t pt-6 text-sm">
        <Link href="/privacidade" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Privacidade
        </Link>
        <Link href="/termos" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Termos de uso
        </Link>
      </footer>
    </div>
  );
}
