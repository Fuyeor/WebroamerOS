// @/apps/options/components/font-size-selector.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { map } from 'lit/directives/map.js';
import { Locale } from '@fuyeor/locale';
import { appearanceSignal, AppearanceAPI, type FontSize } from '@/shared/signals/settings';
import { tooltip } from '@/shared/directives/tooltip';

const fontSizeOptions: FontSize[] = ['smallest', 'small', 'medium', 'large', 'largest'];

@customElement('font-size-selector')
export class FontSizeSelector extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      margin-top: 24px;
    }
    /* 字体大小圆点选择器 */
    .font-size-selector {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding: 0 10px;
      /* 留出两端空白 */
      position: relative;
      /* 用于绘制连接线 */
    }
    .font-size-selector::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 10px;
      right: 10px;
      height: 4px;
      background: var(--text-tertiary);
      transform: translateY(-50%);
      z-index: 0;
    }
    .font-size-cycle {
      position: relative;
      z-index: 1;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--border-default);
      border-radius: 50%;
      background: var(--surface-raised);
      cursor: pointer;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
    }
    .font-size-cycle:hover {
      background: var(--surface-top);
      border-color: var(--color-brand);
    }
    .font-size-cycle.is-active {
      border-color: var(--color-brand);
      box-shadow: 0 0 0 2px var(--color-brand);
    }
    .font-size-tip {
      display: flex;
      justify-content: space-between;
      padding: 16px 10px 0;
    }
  `;

  render() {
    const currentSize = appearanceSignal.get().fontSize;

    return html`
      <div class="font-size-selector">
        ${map(
          fontSizeOptions,
          (size) => html`
            <div
              class="font-size-cycle ${currentSize === size ? 'is-active' : ''}"
              ${tooltip({ text: Locale.t(`settings.fontsize.${size}`), placement: 'top' })}
              @click=${() => AppearanceAPI.update({ fontSize: size })}
            ></div>
          `,
        )}
      </div>
      <div class="font-size-tip">
        <locale-template keypath="settings.fontsize.smallest"></locale-template>
        <locale-template keypath="settings.fontsize.largest"></locale-template>
      </div>
    `;
  }
}
