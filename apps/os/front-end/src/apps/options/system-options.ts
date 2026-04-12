// @/apps/options/system-options.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { desktopBackground } from '@/shared/signals/settings';
import { ToastAPI } from '@/shared/signals/toast';
import { isImageUrl } from '@/shared/utils/is-image';
import '@fuyeor/locale';

import './components/appearance-selector';
import './components/font-size-selector';

@customElement('system-options')
export class SystemOptions extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      color: white;
      padding: 24px;
      box-sizing: border-box;
      overflow-y: auto;
      scroll-behavior: smooth;
    }

    /* 滚动条 */
    :host::-webkit-scrollbar {
      width: 8px;
    }
    :host::-webkit-scrollbar-track {
      background: transparent;
    }
    :host::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
    :host::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.4);
    }

    h2 {
      font-size: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 12px;
      margin-top: 0;
      font-weight: 500;
    }
    .section {
      margin-bottom: 32px;
    }
    .color-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .color-btn {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      transition:
        transform 0.2s,
        border-color 0.2s;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    .color-btn:hover {
      transform: scale(1.05);
    }
    .color-btn.active {
      border-color: white;
      transform: scale(1.05);
    }
    .custom-color {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      width: fit-content;
    }
    input[type='color'] {
      -webkit-appearance: none;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
      background: transparent;
    }
    input[type='color']::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    input[type='color']::-webkit-color-swatch {
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }

    .url-input-container {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .url-input-container input[type='text'] {
      width: 100%;
      max-width: 400px;
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .url-input-container input[type='text']:focus {
      border-color: var(--fuyeor-purple, #9370db);
    }
  `;

  #presets = [
    'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)',
    '#1e1e2e',
    '#2c3e50',
    '#16a085',
    '#8e44ad',
    '#2980b9',
  ];

  #setColor(color: string) {
    desktopBackground.set(color);
  }

  #onCustomColorChange(e: Event) {
    desktopBackground.set((e.target as HTMLInputElement).value);
  }

  // 处理图片 URL 改变
  #onUrlChange(e: Event) {
    const url = (e.target as HTMLInputElement).value.trim();
    if (!url) return;

    const img = new Image();
    img.onload = () => {
      // 成功加载，才更新壁纸
      desktopBackground.set(url);
    };
    img.onerror = () => {
      // 加载失败，弹出 Toast 错误！
      ToastAPI.show('图片加载失败，请检查链接是否正确或存在跨域问题。', {
        type: 'error',
        duration: 5000,
      });
    };
    img.src = url; // 触发加载
  }

  render() {
    const currentBg = desktopBackground.get();
    const isImage = isImageUrl(currentBg);

    return html`
      <!-- 外观与字体设置区 -->
      <div class="section">
        <h2><locale-template keypath="settings.theme.mode"></locale-template></h2>
        <appearance-selector></appearance-selector>

        <h2 style="margin-top: 32px;">
          <locale-template keypath="settings.theme.fontsize"></locale-template>
        </h2>
        <font-size-selector></font-size-selector>
      </div>

      <!-- 壁纸设置区 -->
      <div class="section">
        <h2><locale-template keypath="settings.wallpaper.screen"></locale-template></h2>
        <div class="color-grid">
          ${this.#presets.map(
            (color) => html`
              <div
                class="color-btn ${currentBg === color ? 'active' : ''}"
                style="background: ${color}"
                @click=${() => desktopBackground.set(color)}
              ></div>
            `,
          )}
        </div>

        <div class="custom-color">
          <span>自定义纯色：</span>
          <input
            type="color"
            .value=${!isImage && currentBg.startsWith('#') ? currentBg : '#000000'}
            @input=${this.#onCustomColorChange}
          />
        </div>

        <div class="url-input-container" style="margin-top: 16px;">
          <input
            type="text"
            placeholder="输入网络图片地址..."
            .value=${isImage ? currentBg : ''}
            @change=${this.#onUrlChange}
          />
        </div>
      </div>
    `;
  }
}
