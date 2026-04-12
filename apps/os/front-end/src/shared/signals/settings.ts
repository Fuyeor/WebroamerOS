// @/shared/signals/settings
import { createStorageSignal } from '@/shared/signals/utils';

// 壁纸信号
export const desktopBackground = createStorageSignal<string>(
  'os_wallpaper',
  'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)',
);

// 定义外观数据结构
export type ThemeMode = 'auto' | 'light' | 'dark' | 'contrast' | 'black';
export type FontSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';

export interface AppearanceSettings {
  theme: ThemeMode;
  fontSize: FontSize;
}

// 创建包含主题和字体大小的复合信号
export const appearanceSignal = createStorageSignal<AppearanceSettings>('appearance', {
  theme: 'auto',
  fontSize: 'medium',
});

export const AppearanceAPI = {
  update(updates: Partial<AppearanceSettings>) {
    const current = appearanceSignal.get();
    const next = { ...current, ...updates };

    // 更新信号并持久化
    appearanceSignal.set(next);

    // 瞬间同步到 DOM，复刻 IIFE 的核心逻辑
    const root = document.documentElement;
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const contrast = window.matchMedia('(prefers-contrast: high)').matches;

    const activeTheme =
      (next.theme !== 'auto' && next.theme) ||
      (contrast && 'contrast') ||
      (dark && 'dark') ||
      'light';
    root.setAttribute('data-theme', activeTheme);

    const fontSizeMap: Record<FontSize, number> = {
      smallest: 0.8,
      small: 0.9,
      medium: 1,
      large: 1.1,
      largest: 1.2,
    };
    const size = fontSizeMap[next.fontSize];
    root.style.fontSize = size ? `${size}rem` : '';
  },
};
