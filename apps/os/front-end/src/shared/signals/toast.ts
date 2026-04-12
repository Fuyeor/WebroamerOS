// @/shared/signals/toast.ts
import { Signal } from 'signal-polyfill';

export interface Toast {
  id: symbol;
  message?: string;
  html?: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}
export interface ToastOptions {
  html?: string;
  type?: Toast['type'];
  duration?: number;
}

const MAX_TOASTS = 3;

export const toastsSignal = new Signal.State<Toast[]>([]);

export const ToastAPI = {
  show(message: string, options: ToastOptions = {}) {
    const id = Symbol();
    const newToast: Toast = {
      id,
      message,
      html: options.html,
      type: options.type || 'info',
      duration: options.duration || 3000,
    };

    const currentToasts = toastsSignal.get();
    const newToasts =
      currentToasts.length >= MAX_TOASTS
        ? // 如果满了，挤掉最旧的
          [...currentToasts.slice(1), newToast]
        : // 没满，直接添加
          [...currentToasts, newToast];

    toastsSignal.set(newToasts);

    window.setTimeout(() => this.remove(id), newToast.duration);
  },

  remove(id: symbol) {
    toastsSignal.set(toastsSignal.get().filter((t) => t.id !== id));
  },
};
