// @/api/system.ts
import apiClient from '@/api';

/**
 * get system info
 * @returns SystemInfoResponse
 */
export const fetchSystemInfo = (signal?: AbortSignal) => {
  return apiClient.get('/system/info', { signal });
};

export const systemKeys = {
  info: () => ['system', 'info'] as const,
};
