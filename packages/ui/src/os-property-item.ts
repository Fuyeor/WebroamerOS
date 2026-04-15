// @webroamer/ui/src/os-property-item.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@fuyeor/locale';

@customElement('os-property-item')
export class OsPropertyItem extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) value = '';

  static styles = css`
    :host {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    :host(:last-child) {
      border-bottom: none;
    }
    .label {
      color: #888;
      font-size: 13px;
    }
    .value {
      font-size: 13px;
      color: #eee;
      font-weight: 500;
    }
  `;

  render() {
    return html`
      <locale-template class="label" .keypath=${this.label}></locale-template>
      <span class="value">${this.value}</span>
    `;
  }
}
