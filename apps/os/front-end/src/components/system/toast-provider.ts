// @/components/system/toast-provider
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { map } from 'lit/directives/map.js';
import { toastsSignal, ToastAPI } from '@/shared/signals/toast';

@customElement('toast-provider')
export class ToastProvider extends SignalWatcher(LitElement) {
  static styles = css`
    .toast-provider-container {
      position: fixed;
      z-index: 9999; /* 比所有窗口都高 */
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      max-width: 350px;
      pointer-events: none;
      /* 位置：我们默认放在右上角 */
      top: 20px;
      right: 20px;
      align-items: flex-end;
    }

    .toast-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      color: #fff;
      background: #333;
      width: fit-content;
      pointer-events: auto;
      /* 让新出现的 Toast 从下方优雅滑入 */
      animation: slideIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .toast--success {
      background: #28a745;
    }
    .toast--error {
      background: #dc3545;
    }

    .toast-message {
      flex-grow: 1;
    }

    .toast-close-btn {
      background: none;
      border: none;
      color: inherit;
      margin-left: 15px;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    .toast-close-btn:hover {
      opacity: 1;
    }
  `;

  render() {
    const toasts = toastsSignal.get();

    return html`
      <div class="toast-provider-container">
        ${map(
          toasts,
          (toast) => html`
            <div class="toast-item toast--${toast.type}">
              <span class="toast-message">${toast.message}</span>
              <button class="toast-close-btn" @click=${() => ToastAPI.remove(toast.id)}>
                &times;
              </button>
            </div>
          `,
        )}
      </div>
    `;
  }
}
