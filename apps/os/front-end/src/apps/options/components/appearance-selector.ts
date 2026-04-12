// @/apps/options/components/appearance-selector.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { map } from 'lit/directives/map.js';
import { getTwemojiUrl } from '@fuyeor/commons';
import { appearanceSignal, AppearanceAPI, type ThemeMode } from '@/shared/signals/settings';
import '@fuyeor/locale';

const themeOptions: ThemeMode[] = ['light', 'dark', 'black', 'contrast'];

const themeIconMap: Record<ThemeMode, string> = {
  auto: '🌓',
  light: '☀️',
  dark: '🌙',
  contrast: '🌗',
  black: '🖤',
};

@customElement('appearance-selector')
export class AppearanceSelector extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    /* 主题选择器 */
    .theme-options {
      display: flex;
      gap: 20px;
      margin-top: 20px;
      justify-content: space-between;
    }
    .theme-options span {
      color: var(--text-secondary);
    }
    .theme-option-button {
      flex: 1;
      min-width: 80px;
      padding: 20px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-raised);
      cursor: pointer;
      transition: all 0.3s ease;
      gap: 4px;
    }
    .theme-option-button:hover {
      background: var(--surface-raised-hover);
      border-color: var(--color-brand);
    }
    .theme-option-button.is-active {
      box-shadow: var(--input-border-shadow);
      border-color: var(--color-brand);
    }
    .icon-emoji {
      width: 2rem;
      margin-bottom: 12px;
    }
    /*手机版*/
    @media (width <= 768px) {
      .theme-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr); /* 每行 2 列，等宽 */
      }
    }
  `;

  render() {
    const currentTheme = appearanceSignal.get().theme;

    return html`
      <div class="theme-options">
        ${map(
          themeOptions,
          (theme) => html`
            <div
              class="theme-option-button ${currentTheme === theme ? 'is-active' : ''}"
              @click=${() => AppearanceAPI.update({ theme })}
            >
              <img class="icon-emoji" src="${getTwemojiUrl(themeIconMap[theme])}" alt="" />
              <locale-template keypath="settings.theme.${theme}"></locale-template>
            </div>
          `,
        )}
      </div>
    `;
  }
}
