// @/shared/signals/auth.ts
import { Signal } from 'signal-polyfill';
import type { paths } from '@/shared/types/api';

export type User = NonNullable<
  paths['/auth/status']['get']['responses']['200']['content']['application/json'] & {
    state: 'active';
  }
>['user'];

export type SystemState = 'setup' | 'signedOut' | 'locked' | 'active';

export const systemState = new Signal.State<SystemState>('setup');
export const currentUser = new Signal.State<User | null>(null);
