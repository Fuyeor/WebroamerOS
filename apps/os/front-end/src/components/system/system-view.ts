// @/components/system/system-view.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { desktopBackground } from '@/shared/signals/settings';
import { isImageUrl } from '@/shared/utils/is-image';

import '@fuyeor/locale';
import './status-bar';
import './screen';
import './task-bar';
import './start-menu';
import './toast-provider';

@customElement('system-view')
export class SystemView extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      transition: background 0.3s ease;
    }

    system-screen {
      flex: 1;
      position: relative;
      z-index: 10;
    }
  `;

  render() {
    const bgValue = desktopBackground.get();

    // apply the correct CSS background
    this.style.background = isImageUrl(bgValue)
      ? `url('${bgValue}') center / cover no-repeat`
      : bgValue;

    return html`
      <system-status-bar></system-status-bar>
      <system-screen>
        <system-start-menu></system-start-menu>
      </system-screen>
      <system-task-bar></system-task-bar>
      <toast-provider></toast-provider>
    `;
  }
}
