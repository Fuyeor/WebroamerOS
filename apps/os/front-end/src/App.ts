// @/App.ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { fetchAuthStatus } from '@/api/auth';
import { systemState } from '@/shared/signals/auth';

import '@/components/system/setup-view';
import '@/components/system/auth-view';
import '@/components/system/system-view';

@customElement('os-root')
export class OsRoot extends SignalWatcher(LitElement) {
  async connectedCallback() {
    super.connectedCallback();
    // initialize OS
    try {
      await fetchAuthStatus();
    } catch {}
  }

  render() {
    const state = systemState.get();

    switch (state) {
      case 'setup':
        return html`<os-setup-view></os-setup-view>`;
      case 'signedOut':
      case 'locked':
        return html`<os-auth-view .mode=${state}></os-auth-view>`;
      case 'active':
        // render the desktop system only when active
        return html`<system-view></system-view>`;
      default:
        return html`<!-- Booting... -->`;
    }
  }
}
