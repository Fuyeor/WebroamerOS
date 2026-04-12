// @/components/system/screen.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { WindowManagerAPI } from '@/shared/signals/wm';
import { desktopBackground } from '@/shared/signals/settings';
import { isImageUrl } from '@/shared/utils/is-image';

import '@/components/window/window-manager';

@customElement('system-screen')
export class SystemScreen extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      flex: 1;
      position: relative; /* 核心：开启局部坐标系 */
      overflow: hidden;
      display: block;
    }
    .desktop-content {
      position: absolute; /* 已经有了，很好 */
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      /* 确保这里能包住所有的 slot 内容 */
    }
    .desktop-icon {
      width: 72px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
      transition:
        background 0.2s,
        border 0.2s;
      border: 1px solid transparent;
    }
    .desktop-icon:hover {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .desktop-icon img {
      width: 40px;
      height: 40px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }
    .desktop-icon span {
      color: white;
      font-size: 12px;
      text-align: center;
      text-shadow:
        0 1px 2px black,
        0 1px 4px black;
    }
  `;

  #openSettings() {
    WindowManagerAPI.openApp('settings', 'System Settings', 'system-options');
  }

  render() {
    const bgValue = desktopBackground.get();

    // 动态应用正确的 CSS background 缩写属性
    this.style.background = isImageUrl(bgValue)
      ? `url('${bgValue}') center / cover no-repeat`
      : bgValue;

    return html`
      <div class="desktop-content">
        <div class="desktop-icon" @dblclick=${this.#openSettings}>
          <img src="/favicon.svg" alt="Settings" />
          <span><locale-template keypath="settings"></locale-template></span>
        </div>
        <window-manager></window-manager>
        <slot></slot>
      </div>
    `;
  }
}
