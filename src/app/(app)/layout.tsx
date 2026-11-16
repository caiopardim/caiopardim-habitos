import { AppDataProvider } from "@/components/providers/app-data";
import { DataGate } from "@/components/layout/data-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <DataGate>{children}</DataGate>
    </AppDataProvider>
  );
}
