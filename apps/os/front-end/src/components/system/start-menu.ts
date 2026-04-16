// @/components/system/start-menu.ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { MutationController } from '@fuyeor/query';
import { fetchAuthStatus, lockSession, signOut } from '@/api/auth';
import { isStartMenuOpen } from '@/shared/signals/ui';
import { toggleStartMenu } from '@/shared/signals/ui';
import { WindowManagerAPI } from '@/shared/signals/wm';
import { styles } from './start-menu.styles';

import '@/apps/options/system-options';
import '@/apps/about/about-pc';

@customElement('system-start-menu')
export class SystemStartMenu extends SignalWatcher(LitElement) {
  static styles = styles;

  #openSettings() {
    toggleStartMenu();
    WindowManagerAPI.openApp('settings', 'System Settings', 'system-options');
  }

  #openAbout() {
    toggleStartMenu();
    WindowManagerAPI.openApp('about-pc', 'About This PC', 'app-about');
  }

  // use a MutationController to handle sign out
  // so we can show loading state during the process
  #signOutMutation = new MutationController(this, {
    mutationFn: signOut,
    // refresh global auth status on success, App.ts will switch to login screen
    onSuccess: () => fetchAuthStatus(),
  });

  async #handleLock() {
    toggleStartMenu();
    try {
      await lockSession();
      // refresh global auth status
      // App.ts will automatically switch to lock screen
      await fetchAuthStatus();
    } catch (err) {
      console.error('Failed to lock session', err);
    }
  }

  #handleSignOut() {
    toggleStartMenu();
    this.#signOutMutation.mutate();
  }

  render() {
    const isOpen = isStartMenuOpen.get();
    this.toggleAttribute('open', isOpen);

    return html`
      <div class="menu-header">
        <h3><locale-template keypath="system.start"></locale-template></h3>
      </div>
      <div class="menu-content">
        <div class="menu-item" @click=${this.#openSettings}>
          <span>⚙️</span>
          <locale-template keypath="settings"></locale-template>
        </div>
        <div class="menu-item" @click=${this.#openAbout}>
          <span>ℹ️</span>
          <locale-template keypath="menu.about"></locale-template>
        </div>
      </div>

      <div class="menu-footer">
        <button class="footer-btn" @click=${this.#handleLock}>
          <span>🔒</span>
          <locale-template keypath="menu.lock"></locale-template>
        </button>
        <button
          class="footer-btn"
          @click=${this.#handleSignOut}
          ?disabled=${this.#signOutMutation.isPending}
        >
          <span>🔌</span>
          <locale-template keypath="menu.signout"></locale-template>
        </button>
      </div>
    `;
  }
}
