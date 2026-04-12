// @/shared/signals/wm.ts
import { Signal } from 'signal-polyfill';

// 标准的 OS 窗口数据结构
export interface WindowState {
  /** 唯一标识（如 'settings'）*/
  id: string; // 唯一标识（如 'settings'）
  /** 窗口标题 */
  title: string;
  /** 该应用对应的 HTML 标签名（如 'app-settings'） */
  component: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isFocused: boolean;
  /** 状态 */
  isMaximized: boolean;
  isMinimized: boolean;
  /** 记录最大化前的状态，用于向下还原 */
  previousState?: { x: number; y: number; width: number; height: number };
}

// 全局窗口数组信号（初始为空桌面）
export const windowsSignal = new Signal.State<WindowState[]>([]);

// 全局 Z-index 计数器，保证新点开的窗口永远在最上面
let globalZIndex = 100;

export const WindowManagerAPI = {
  openApp(id: string, title: string, component: string) {
    const windows = windowsSignal.get();

    // 如果已经打开了，就把它提到最顶层
    if (windows.find((w) => w.id === id)) {
      // 如果已经打开了（比如被最小化了），恢复并聚焦
      this.restoreAndFocus(id);
      return;
    }

    globalZIndex++;
    // 默认层叠坐标，制造“瀑布流”打开效果
    const offset = windows.length * 30;
    const newWindow: WindowState = {
      id,
      title,
      component,
      x: 100 + offset,
      y: 100 + offset,
      width: 800,
      height: 600,
      zIndex: globalZIndex,
      isFocused: true,
      isMaximized: false,
      isMinimized: false,
    };

    // 更新信号：将其他窗口设为失焦，并加入新窗口
    windowsSignal.set([...windows.map((w) => ({ ...w, isFocused: false })), newWindow]);
  },

  closeApp(id: string) {
    const current = windowsSignal.get();
    windowsSignal.set(current.filter((w) => w.id !== id));
  },

  // 恢复并聚焦
  restoreAndFocus(id: string) {
    const windows = windowsSignal.get();

    globalZIndex++;
    windowsSignal.set(
      windows.map((w) =>
        w.id === id
          ? { ...w, zIndex: globalZIndex, isFocused: true, isMinimized: false }
          : { ...w, isFocused: false },
      ),
    );
  },

  // 切换最大化/还原
  toggleMaximize(id: string) {
    const windows = windowsSignal.get();
    windowsSignal.set(
      windows.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          // 向下还原
          return { ...w, isMaximized: false, ...w.previousState };
        } else {
          // 最大化（保存当前状态）
          return {
            ...w,
            isMaximized: true,
            previousState: { x: w.x, y: w.y, width: w.width, height: w.height },
            // 最大化时占满屏幕（交由 CSS 处理，这里重置坐标防止溢出）
            x: 0,
            y: 0,
          };
        }
      }),
    );
    this.restoreAndFocus(id);
  },

  // 最小化
  minimizeApp(id: string) {
    const windows = windowsSignal.get();
    windowsSignal.set(
      windows.map((w) => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w)),
    );
  },

  // 更新位置和大小 (用于 Drag 和 Resize)
  updateBounds(id: string, bounds: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) {
    const windows = windowsSignal.get();
    windowsSignal.set(windows.map((w) => (w.id === id ? { ...w, ...bounds } : w)));
  },
};
