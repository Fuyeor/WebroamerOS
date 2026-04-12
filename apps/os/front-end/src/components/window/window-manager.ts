// @/components/window/window-manager.ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { windowsSignal } from '@/shared/signals/wm';

import './system-window';

@customElement('window-manager')
export class WindowManager extends SignalWatcher(LitElement) {
  protected createRenderRoot() {
    // 禁用 Shadow DOM，这样窗口可以直接浮在屏幕上
    return this;
  }

  render() {
    const windows = windowsSignal.get();

    return html`
      <!-- 遍历所有打开的窗口 -->
      ${windows.map(
        (w) => html`
          <system-window .state=${w}>
            <!-- 动态渲染子组件标签 -->
            ${unsafeHTML(`<${w.component}></${w.component}>`)}
          </system-window>
        `,
      )}
    `;
  }
}
