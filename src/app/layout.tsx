import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { ThemeColorSync } from "@/components/providers/theme-color-sync";
import { Toaster } from "@/components/ui/sonner";
import { THEME_COLOR_BOOTSTRAP, THEME_COLORS } from "@/lib/theme-color";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // O app é escuro por padrão e o tema é escolhido no app (não segue o sistema).
  // ThemeColorSync troca a cor quando o usuário muda o tema.
  themeColor: THEME_COLORS.dark,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_COLOR_BOOTSTRAP }} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <ThemeColorSync />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
