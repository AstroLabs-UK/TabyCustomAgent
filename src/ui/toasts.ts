/** Lightweight toast bus — no external deps */

export type ToastKind = "info" | "error" | "success";

export type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  at: number;
};

type Listener = (toasts: Toast[]) => void;

const listeners = new Set<Listener>();
let toasts: Toast[] = [];

function emit() {
  for (const l of listeners) l(toasts);
}

export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn);
  fn(toasts);
  return () => listeners.delete(fn);
}

export function pushToast(message: string, kind: ToastKind = "info", ttlMs = 4000) {
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, kind, message, at: Date.now() }];
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, ttlMs);
  return id;
}

export function toastError(message: string) {
  return pushToast(message, "error", 6000);
}

export function toastSuccess(message: string) {
  return pushToast(message, "success", 3500);
}
