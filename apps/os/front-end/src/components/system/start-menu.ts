// @/components/system/start-menu.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { isStartMenuOpen } from '@/shared/signals/ui';
import { toggleStartMenu } from '@/shared/signals/ui';
import { WindowManagerAPI } from '@/shared/signals/wm';

import '@/apps/options/system-options';

@customElement('system-start-menu')
export class SystemStartMenu extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 60px; /* 任务栏高度 + 间距 */
      left: 12px;
      width: 300px;
      min-height: 400px;
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      z-index: 1002;
    }

    :host([open]) {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .menu-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .menu-item {
      padding: 12px 20px;
      color: #eee;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background 0.2s;
    }

    .menu-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  `;

  #openSettings() {
    toggleStartMenu();
    WindowManagerAPI.openApp('settings', 'System Settings', 'system-options');
  }

  render() {
    const isOpen = isStartMenuOpen.get();
    this.toggleAttribute('open', isOpen);

    return html`
      <div class="menu-header">
        <h3><locale-template keypath="system.start"></locale-template></h3>
      </div>
      <div class="menu-content">
        <div class="menu-item" @click=${this.#openSettings}>
          <locale-template keypath="settings"></locale-template>
        </div>
        <div class="menu-item">
          <locale-template keypath="menu.shutdown"></locale-template>
        </div>
      </div>
    `;
  }
}
