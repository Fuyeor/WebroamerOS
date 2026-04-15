// @/shared/types/api-helpers.ts
import type { paths } from '@/shared/types/api.d.ts';

/**
 * extract response data from OpenAPI response type
 * priority: JSON -> Raw -> void
 */
export type ExtractResponse<T> = T extends {
  responses: { 200: { content: { 'application/json': infer Data } } };
}
  ? Data
  : T extends { responses: { 200: infer Raw } }
    ? Raw
    : void;

/**
 * extract request body (POST/PUT/PATCH)
 */
export type ExtractRequestBody<T> = T extends {
  requestBody: { content: { 'application/json': infer Body } };
}
  ? Body
  : never;

/**
 * extract query parameters (Query Params)
 */
export type ExtractQueryParams<T> = T extends {
  parameters: { query?: infer Query };
}
  ? Query
  : never;
