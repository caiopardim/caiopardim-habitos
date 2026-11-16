import { BarChart3, CalendarCheck, ListChecks, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/hoje", label: "Hoje", icon: CalendarCheck },
  { href: "/habitos", label: "Hábitos", icon: ListChecks },
  { href: "/evolucao", label: "Evolução", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;
