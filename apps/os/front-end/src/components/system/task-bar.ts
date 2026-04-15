// @/components/system/task-bar.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { tooltip } from '@/shared/directives/tooltip';
import { toggleStartMenu } from '@/shared/signals/ui';
import { windowsSignal, WindowManagerAPI } from '@/shared/signals/wm';

@customElement('system-task-bar')
export class SystemTaskBar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      z-index: 1001;
    }

    .task-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      height: var(--task-bar-height, 48px);
      padding: 0 16px;
      background: var(--fuyeor-purple-light,);
      backdrop-filter: var(--glass-blur,);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      box-sizing: border-box;
    }

    .start-button {
      width: 28px;
      height: 28px;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .start-button:hover {
      transform: scale(1.15);
    }

    .start-button img {
      width: 100%;
      height: 100%;
    }

    /* 运行中的应用图标样式 */
    .app-icon {
      height: 40px;
      padding: 0 12px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      font-size: 0.8rem;
      font-weight: bold;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid transparent;
      transition: 0.2s;
      user-select: none;
    }
    .app-icon:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .app-icon[active] {
      background: rgba(255, 255, 255, 0.15);
      border-bottom: 3px solid var(--fuyeor-purple);
    }
  `;

  #onAppClick(id: string, isFocused: boolean, isMinimized: boolean) {
    if (isMinimized) {
      WindowManagerAPI.restoreAndFocus(id);
    } else if (isFocused) {
      WindowManagerAPI.minimizeApp(id);
    } else {
      WindowManagerAPI.restoreAndFocus(id);
    }
  }

  render() {
    const windows = windowsSignal.get();

    return html`
      <nav class="task-bar">
        <div class="start-button" @click=${toggleStartMenu}>
          <img src="/favicon.svg" alt="Start" />
        </div>

        <!-- 动态渲染任务栏上的应用图标 -->
        ${windows.map(
          (w) => html`
            <div
              class="app-icon"
              ?active=${w.isFocused && !w.isMinimized}
              ${tooltip({ text: w.title, placement: 'top' })}
              @click=${() => this.#onAppClick(w.id, w.isFocused, w.isMinimized)}
            >
              <!-- 临时用首字母代替图标 -->
              ${w.title}
            </div>
          `,
        )}
      </nav>
    `;
  }
}
