/** Cookie que marca a navegação em modo demonstração (lido também pelo middleware). */
export const DEMO_COOKIE = "zoryka_demo";

export function isDemoActive(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === `${DEMO_COOKIE}=1`);
}

export function enterDemo() {
  document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function exitDemo() {
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
