/** XP necessário para sair do nível `nivel` e chegar ao próximo. */
export function xpParaProximoNivel(nivel: number): number {
  return Math.round(100 * Math.pow(nivel, 1.5));
}

export interface LevelInfo {
  nivel: number;
  /** XP acumulado dentro do nível atual. */
  xpNoNivel: number;
  /** XP total necessário para passar do nível atual. */
  xpDoNivel: number;
  /** 0–1 */
  progresso: number;
}

export function levelFromXp(xpTotal: number): LevelInfo {
  let nivel = 1;
  let restante = Math.max(0, Math.floor(xpTotal));
  while (restante >= xpParaProximoNivel(nivel)) {
    restante -= xpParaProximoNivel(nivel);
    nivel += 1;
  }
  const xpDoNivel = xpParaProximoNivel(nivel);
  return { nivel, xpNoNivel: restante, xpDoNivel, progresso: restante / xpDoNivel };
}
