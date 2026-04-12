// @/shared/signals/utils.ts
import { Signal } from 'signal-polyfill';

/**
 * 持久化信号生成器
 * 自动处理 localStorage 的序列化、反序列化，并无缝接入 Lit 的响应式系统
 */
export function createStorageSignal<T>(key: string, defaultValue: T) {
  // 初始化时尝试从硬盘读取
  const stored = window.localStorage.getItem(key);
  const initialValue = stored !== null ? JSON.parse(stored) : defaultValue;

  // 创建底层真实信号
  const signal = new Signal.State<T>(initialValue);

  // 返回一个劫持代理
  return {
    get(): T {
      // 当 Lit 组件调用 get 时，底层的 signal.get() 会被触发
      return signal.get();
    },
    set(val: T) {
      signal.set(val);
      // 异步写入硬盘，绝不阻塞 UI 主线程的渲染
      Promise.resolve().then(() => {
        window.localStorage.setItem(key, JSON.stringify(val));
      });
    },
  };
}
