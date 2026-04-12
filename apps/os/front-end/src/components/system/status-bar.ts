// @/components/system/status-bar.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { Locale } from '@fuyeor/locale';

@customElement('system-status-bar')
export class SystemStatusBar extends SignalWatcher(LitElement) {
  @state() private _timeStr = '';
  #timerId?: number;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      z-index: 1000;
    }

    .status-bar {
      height: var(--status-bar-height);
      padding: 0px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: var(--glass-blur);
      font-size: 0.75rem;
      color: rgb(255, 255, 255);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      box-sizing: border-box;
    }

    .brand {
      font-weight: 600;
      color: var(--fuyeor-purple);
      letter-spacing: 0.5px;
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .security-dot {
      width: 6px;
      height: 6px;
      background: #00ff00;
      border-radius: 50%;
      box-shadow: 0 0 8px #00ff00;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.#updateTime();
    this.#timerId = window.setInterval(() => this.#updateTime(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#timerId) window.clearInterval(this.#timerId);
  }

  #updateTime() {
    const now = new Date();
    this._timeStr = now.toLocaleTimeString(Locale.current, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  render() {
    return html`
      <header class="status-bar">
        <div class="left-section">
          <span class="brand">Webroamer</span>
        </div>
        <div class="right-section">
          <span class="time">${this._timeStr}</span>
          <div class="security-dot" title="WebAuthn Protected"></div>
        </div>
      </header>
    `;
  }
}
