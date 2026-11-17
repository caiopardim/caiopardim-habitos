import { track } from "@/lib/analytics";

/** Notificações push no navegador (inscrição deste aparelho). */

export type PushSupport = "ok" | "ios-instalar" | "sem-suporte" | "nao-configurado";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "sem-suporte";
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "nao-configurado";
  // No iPhone, push só funciona com o app instalado na tela de início (iOS 16.4+).
  if (isIOS() && !isStandalone()) return "ios-instalar";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
    return "sem-suporte";
  return "ok";
}

export function permission(): NotificationPermission | "indisponivel" {
  return typeof Notification === "undefined" ? "indisponivel" : Notification.permission;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  return (
    (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js"))
  );
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== "ok") return null;
  const reg = await registration();
  return reg.pushManager.getSubscription();
}

/** Pede permissão, inscreve o aparelho e salva no servidor. */
export async function enablePush(): Promise<"ativado" | "negado" | "erro"> {
  const p = await Notification.requestPermission();
  if (p !== "granted") return "negado";
  try {
    const reg = await registration();
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      }));
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    track("lembretes_ativados");
    return "ativado";
  } catch (e) {
    console.error("Não foi possível ativar as notificações", e);
    return "erro";
  }
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => undefined);
  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<number> {
  const res = await fetch("/api/push/test", { method: "POST" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json()) as { enviados: number }).enviados;
}
