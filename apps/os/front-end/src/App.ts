// @/App.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@fuyeor/locale';
import './components/system/status-bar';
import './components/system/screen';
import './components/system/task-bar';
import './components/system/start-menu';

import '@/components/system/toast-provider';

@customElement('system-view')
export class SystemView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-image: radial-gradient(circle at center, #1a1a2e 0%, #000 100%);
    }

    system-screen {
      flex: 1;
      position: relative;
      z-index: 10; /* 低于 status-bar 的 1000 */
    }
  `;

  constructor() {
    super();
    // useFontLoader();
  }

  render() {
    return html`
      <!-- 顶部状态栏 -->
      <system-status-bar></system-status-bar>

      <!-- 系统主视口（桌面与窗口） -->
      <system-screen>
        <system-start-menu></system-start-menu>
      </system-screen>

      <!-- 底部任务栏/Dock -->
      <system-task-bar> </system-task-bar>

      <toast-provider></toast-provider>
    `;
  }
}
