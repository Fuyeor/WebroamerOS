// @/api/auth.ts
import apiClient from '@/api';
import { systemState, currentUser } from '@/shared/signals/auth';
import type { paths } from '@/shared/types/api';
import type { ExtractRequestBody } from '@/shared/types/api-helpers';

/**
 * get auth status: check if system is initialized, if user is signed in, or if session is locked
 * automatically inferred as: 'setup' | 'signedOut' | 'locked' | 'active'
 */
export const fetchAuthStatus = async (signal?: AbortSignal) => {
  const res = await apiClient.get('/auth/status', { signal });

  if ('user' in res) {
    currentUser.set(res.user);
  } else {
    currentUser.set(null);
  }

  systemState.set(res.state);
  return res;
};

/**
 * system setup: create the first admin account
 */
export type SetupRequest = ExtractRequestBody<paths['/auth/setup']['post']>;
export const setupSystem = (body: SetupRequest) => {
  return apiClient.post('/auth/setup', body);
};

/**
 * user signin: obtain session cookie
 */
export type SignInRequest = ExtractRequestBody<paths['/auth/signin']['post']>;
export const signIn = (body: SignInRequest) => {
  return apiClient.post('/auth/signin', body);
};

/**
 * user signout: clear session on server and invalidate cookie
 */
export const signOut = () => {
  return apiClient.post('/auth/signout');
};

/**
 * lock system: switch current session to locked state
 */
export const lockSession = async () => {
  await apiClient.post('/auth/lock');
  systemState.set('locked');
};

/**
 * unlock system: switch from locked state back to active state
 */
export type UnlockRequest = ExtractRequestBody<paths['/auth/unlock']['post']>;
export const unlockSession = (body: UnlockRequest) => {
  return apiClient.post('/auth/unlock', body);
};
