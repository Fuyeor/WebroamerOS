// @/components/system/setup-view.ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { Signal } from 'signal-polyfill';
import { Locale } from '@fuyeor/locale';
import { MutationController } from '@fuyeor/query';
import { setupSystem, fetchAuthStatus } from '@/api/auth';
import { ToastAPI } from '@/shared/signals/toast';
import { styles } from './setup-view.styles';
import '@fuyeor/locale';

@customElement('os-setup-view')
export class OsSetupView extends SignalWatcher(LitElement) {
  readonly #username = new Signal.State('');
  readonly #nickname = new Signal.State('');
  readonly #password = new Signal.State('');

  #setupMutation = new MutationController(this, {
    mutationFn: setupSystem,
    onSuccess: async () => {
      ToastAPI.show('System initialized successfully!', { type: 'success' });
      // After re-pulling the status
      // App.ts will automatically switch to the login or active interface.
      await fetchAuthStatus();
    },
    onError: (err: any) => ToastAPI.show(err.message || 'Setup failed', { type: 'error' }),
  });

  static styles = styles;

  render() {
    const isPending = this.#setupMutation.isPending;

    const username = this.#username.get();
    const nickname = this.#nickname.get();

    return html`
      <div class="card">
        <h1><locale-template keypath="system.setup.welcome"></locale-template></h1>
        <p><locale-template keypath="system.setup.welcome.desc"></locale-template></p>

        <input
          type="text"
          placeholder="${Locale.t('system.username')}"
          .value=${username}
          @input=${(e: any) => this.#username.set(e.target.value)}
          ?disabled=${isPending}
        />
        <input
          type="text"
          placeholder="${Locale.t('system.nickname')}"
          .value=${nickname}
          @input=${(e: any) => this.#nickname.set(e.target.value)}
          ?disabled=${isPending}
        />
        <input
          type="password"
          placeholder="${Locale.t('system.password')}"
          .value=${this.#password.get()}
          @input=${(e: any) => this.#password.set(e.target.value)}
          ?disabled=${isPending}
        />

        <button
          @click=${() =>
            this.#setupMutation.mutate({
              username: username,
              nickname: nickname,
              password: this.#password.get() || undefined,
            })}
          ?disabled=${isPending || !username || !nickname}
        >
          ${isPending ? Locale.t('system.setup.initializing') : Locale.t('system.setup.start')}
        </button>
      </div>
    `;
  }
}
