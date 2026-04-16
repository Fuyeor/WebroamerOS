// @/components/system/auth-view.ts
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { MutationController } from '@fuyeor/query';
import { getAvatarUrl } from '@fuyeor/commons';
import { currentUser } from '@/shared/signals/auth';
import { fetchAuthStatus } from '@/api/auth';
import { signIn, unlockSession } from '@/api/auth';
import { ToastAPI } from '@/shared/signals/toast';
import { styles } from './auth-view.styles';

@customElement('os-auth-view')
export class OsAuthView extends SignalWatcher(LitElement) {
  // 'signedOut' | 'locked'
  @property({ type: String }) accessor mode = 'signedOut';

  @state() accessor #username = '';
  @state() accessor #password = '';

  // same engine for both sign in and unlock, just different underlying API calls
  #authMutation = new MutationController(this, {
    mutationFn: (data: any) => (this.mode === 'locked' ? unlockSession(data) : signIn(data)),
    onSuccess: async () => {
      await fetchAuthStatus();
    },
    onError: (err: any) => ToastAPI.show(err.message || 'Authentication failed', { type: 'error' }),
  });

  static styles = styles;

  #handleSubmit(e: Event) {
    e.preventDefault(); // support Enter key submission
    const isLocked = this.mode === 'locked';

    if (!isLocked && !this.#username) {
      ToastAPI.show('Username required', { type: 'error' });
      return;
    }

    this.#authMutation.mutate({
      // in locked mode, username is not needed, just validate password
      username: isLocked ? undefined : this.#username,
      password: this.#password || undefined, // support empty password
    });
  }

  render() {
    const isPending = this.#authMutation.isPending;
    const isLocked = this.mode === 'locked';

    const user = currentUser.get();

    // decide avatar based on state
    // lock: real user avatar; signin: default system avatar
    const avatarUrl = isLocked && user ? getAvatarUrl(user.avatar) : getAvatarUrl(null);

    return html`
      <form class="auth-container" @submit=${this.#handleSubmit}>
        <img class="avatar" src=${avatarUrl} alt="User Avatar" />

        ${isLocked && user
          ? html`<div class="name-display">${user.nickname || user.username}</div>`
          : html`
              <!-- 登录状态：需要输入用户名 -->
              <input
                type="text"
                placeholder="Username"
                .value=${this.#username}
                @input=${(e: any) => (this.#username = e.target.value)}
                ?disabled=${isPending}
              />
            `}

        <!-- 统一的密码输入框 -->
        <input
          type="password"
          placeholder="Password"
          .value=${this.#password}
          @input=${(e: any) => (this.#password = e.target.value)}
          ?disabled=${isPending}
        />

        <button type="submit" ?disabled=${isPending}>
          ${isPending ? 'Authenticating...' : isLocked ? 'Unlock System' : 'Sign In'}
        </button>
      </form>
    `;
  }
}
