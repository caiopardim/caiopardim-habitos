import {
  Bed,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  Candy,
  Cigarette,
  Coffee,
  Droplet,
  Dumbbell,
  Footprints,
  Gamepad2,
  GraduationCap,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Pill,
  Salad,
  Smartphone,
  Sun,
  Target,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { isLucide, lucideName } from "@/lib/domain/habit-symbol";
import { cn } from "@/lib/utils";

/** Ícones disponíveis para hábitos (conjunto fixo: traço e peso consistentes com o resto do app). */
export const HABIT_ICONS: Record<string, { Icon: LucideIcon; nome: string }> = {
  Droplet: { Icon: Droplet, nome: "Água" },
  BookOpen: { Icon: BookOpen, nome: "Livro" },
  Dumbbell: { Icon: Dumbbell, nome: "Treino" },
  Footprints: { Icon: Footprints, nome: "Caminhada" },
  Bike: { Icon: Bike, nome: "Bicicleta" },
  Brain: { Icon: Brain, nome: "Mente" },
  Moon: { Icon: Moon, nome: "Sono" },
  Bed: { Icon: Bed, nome: "Descanso" },
  Sun: { Icon: Sun, nome: "Manhã" },
  Leaf: { Icon: Leaf, nome: "Meditação" },
  Heart: { Icon: Heart, nome: "Coração" },
  GraduationCap: { Icon: GraduationCap, nome: "Estudo" },
  Target: { Icon: Target, nome: "Foco" },
  Briefcase: { Icon: Briefcase, nome: "Trabalho" },
  PenLine: { Icon: PenLine, nome: "Escrita" },
  Music: { Icon: Music, nome: "Música" },
  Salad: { Icon: Salad, nome: "Alimentação" },
  Pill: { Icon: Pill, nome: "Remédio" },
  Coffee: { Icon: Coffee, nome: "Café" },
  Wine: { Icon: Wine, nome: "Álcool" },
  Cigarette: { Icon: Cigarette, nome: "Cigarro" },
  Candy: { Icon: Candy, nome: "Doces" },
  Smartphone: { Icon: Smartphone, nome: "Celular" },
  Gamepad2: { Icon: Gamepad2, nome: "Jogos" },
};

/** Desenha o símbolo do hábito: ícone lucide ou emoji. */
export function HabitIcon({ simbolo, className }: { simbolo: string; className?: string }) {
  if (isLucide(simbolo)) {
    const item = HABIT_ICONS[lucideName(simbolo)];
    if (item)
      return <item.Icon className={cn("inline-block size-[1.1em] align-[-0.15em]", className)} aria-hidden />;
  }
  return (
    <span className={className} aria-hidden>
      {simbolo}
    </span>
  );
}
