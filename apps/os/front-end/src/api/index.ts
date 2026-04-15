// @/api/index.ts
import { HttpClient } from '@fuyeor/commons';
import type { paths } from '@/shared/types/api.d.ts';
import type {
  ExtractResponse,
  ExtractRequestBody,
  ExtractQueryParams,
} from '@/shared/types/api-helpers.ts';

// get parameter types from HttpClient
type OriginalParams = Parameters<typeof HttpClient.prototype.get>;
type RequestOptions = OriginalParams[1];

/**
 * defined the real business contract interface
 */
export interface WebroamerClient extends Omit<
  HttpClient,
  'get' | 'post' | 'put' | 'delete' | 'patch'
> {
  get<P extends keyof paths>(
    path: P,
    options?: RequestOptions & { params?: ExtractQueryParams<paths[P]['get']> },
  ): Promise<ExtractResponse<paths[P]['get']>>;

  post<P extends keyof paths>(
    path: P,
    body: ExtractRequestBody<paths[P]['post']>,
    options?: RequestOptions,
  ): Promise<ExtractResponse<paths[P]['post']>>;

  put<P extends keyof paths>(
    path: P,
    body: ExtractRequestBody<paths[P]['put']>,
    options?: RequestOptions,
  ): Promise<ExtractResponse<paths[P]['put']>>;

  delete<P extends keyof paths>(
    path: P,
    options?: RequestOptions,
  ): Promise<ExtractResponse<paths[P]['delete']>>;
}

const ApiUrl = `/${import.meta.env.VITE__API_VERSION}`;

const rawClient = new HttpClient({
  baseURL: ApiUrl,
  timeout: 10000,
  credentials: 'include',
  refreshEndpoint: '/auth/refresh-token',
  refreshTokenFn: async () => {
    await rawClient.post('/auth/refresh-token');
  },
  onSignOut: () => {},
});

const apiClient = rawClient as any as WebroamerClient;

export default apiClient;
