/** Vibração curta de confirmação no celular (ignorada onde não há suporte ou com movimento reduzido). */
export function haptic(ms = 10) {
  try {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(ms);
  } catch {
    // sem suporte: segue sem vibrar
  }
}
