// @fuyeor/query/src/QueryController.ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { Signal } from 'signal-polyfill';
import { queryCache, hashQueryKey, QUERY_DEFAULT_OPTIONS, createEffect } from './queryClient';

export interface QueryFunctionContext {
  signal?: AbortSignal;
}

export interface UseQueryOptions<TData, TError, TResult = TData> {
  queryKey: () => readonly unknown[];
  queryFn: (context: QueryFunctionContext) => Promise<TData>;
  select?: (data: TData) => TResult;
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  retryDelay?: number;
  enabled?: () => boolean;
  isNotFound?: (error: TError) => boolean;
}

const ongoingPromises = new Map<string, Promise<any>>();

export class QueryController<
  TData = any,
  TError = any,
  TResult = TData,
> implements ReactiveController {
  #opts: UseQueryOptions<TData, TError, TResult> & typeof QUERY_DEFAULT_OPTIONS;

  #data = new Signal.State<TResult | null>(null);
  #error = new Signal.State<TError | null>(null);
  #isLoading = new Signal.State(false);
  #isFetching = new Signal.State(false);
  #isError = new Signal.State(false);
  #isEmpty = new Signal.State(false);
  #isNotFound = new Signal.State(false);

  #currentCacheKey = '';
  #currentKeyArr: readonly unknown[] = [];
  #abortController: AbortController | null = null;
  #stopEffect: (() => void) | null = null;

  constructor(host: ReactiveControllerHost, options: UseQueryOptions<TData, TError, TResult>) {
    // don't accept non-function reactive params to ensure proper dependency tracking
    if (typeof options.queryKey !== 'function') throw new TypeError('queryKey must be a function');
    if (options.enabled && typeof options.enabled !== 'function')
      throw new TypeError('enabled must be a function');

    this.#opts = { ...QUERY_DEFAULT_OPTIONS, ...options };
    host.addController(this);
  }

  get data() {
    return this.#data.get();
  }
  get error() {
    return this.#error.get();
  }
  get isLoading() {
    return this.#isLoading.get();
  }
  get isFetching() {
    return this.#isFetching.get();
  }
  get isError() {
    return this.#isError.get();
  }
  get isEmpty() {
    return this.#isEmpty.get();
  }
  get isNotFound() {
    return this.#isNotFound.get();
  }
  get isSuccess() {
    return !this.#isLoading.get() && !this.#isError.get() && !this.#isNotFound.get();
  }
  get isRetrieved() {
    return this.isSuccess && !this.#isEmpty.get();
  }
  get status() {
    if (this.#isLoading.get()) return 'loading';
    if (this.#isNotFound.get()) return 'not-found';
    if (this.#isError.get()) return 'error';
    if (this.#isEmpty.get()) return 'empty';
    return 'success';
  }

  localRefetch = () => this.executeFetch(this.#currentCacheKey, this.#currentKeyArr);

  updateLocalUI = (rawData: TData | null) => {
    if (rawData === null) {
      this.#data.set(null);
      this.#isEmpty.set(true);
      return;
    }
    const transformed = this.#opts.select
      ? this.#opts.select(rawData)
      : (rawData as unknown as TResult);
    this.#data.set(transformed);

    // empty: null | undefined | '' | [] | {}
    let isEmpty = false;
    if (transformed === null || transformed === undefined) isEmpty = true;
    else if (typeof transformed === 'string') isEmpty = transformed.trim().length === 0;
    else if (Array.isArray(transformed)) isEmpty = transformed.length === 0;
    else if (typeof transformed === 'object' && transformed.constructor === Object) {
      isEmpty = Object.keys(transformed).length === 0;
    }
    this.#isEmpty.set(isEmpty);
  };

  async executeFetch(cacheKey: string, keyArr: readonly unknown[]) {
    if (!cacheKey) return;

    if (ongoingPromises.has(cacheKey)) {
      this.#isFetching.set(true);
      try {
        const sharedData = await ongoingPromises.get(cacheKey);
        this.updateLocalUI(sharedData);
        return;
      } catch {
        /* 交给发起方处理 */
      }
    }

    if (this.#abortController) this.#abortController.abort();
    this.#abortController = new AbortController();

    this.#isFetching.set(true);
    if (!this.#data.get()) this.#isLoading.set(true);
    this.#isError.set(false);

    const fetchPromise = (async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await this.#opts.queryFn({ signal: this.#abortController?.signal });
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          if (attempt >= this.#opts.retry!) throw err;
          await new Promise((r) => window.setTimeout(r, this.#opts.retryDelay));
        }
      }
    })();

    ongoingPromises.set(cacheKey, fetchPromise);

    try {
      const res = await fetchPromise;
      const entry = queryCache.get(cacheKey);
      if (entry) {
        entry.data = res;
        entry.timestamp = Date.now();
        entry.updateUIs.forEach((update) => update(res));
      } else {
        queryCache.set(cacheKey, {
          data: res,
          timestamp: Date.now(),
          subscribers: 1,
          refetchers: new Set([this.localRefetch]),
          updateUIs: new Set([this.updateLocalUI]),
          queryKey: keyArr,
        });
      }
      this.updateLocalUI(res);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.#isError.set(true);
        this.#error.set(err);
        this.#isNotFound.set(
          this.#opts.isNotFound ? this.#opts.isNotFound(err) : err?.status === 404,
        );
        this.updateLocalUI(null);
      }
    } finally {
      ongoingPromises.delete(cacheKey);
      this.#isLoading.set(false);
      this.#isFetching.set(false);
    }
  }

  subscribe() {
    const isEnabled = this.#opts.enabled ? this.#opts.enabled() : true;
    if (!isEnabled) return;

    const keyArr = this.#opts.queryKey();
    this.#currentCacheKey = hashQueryKey(keyArr);
    this.#currentKeyArr = keyArr;

    const cached = queryCache.get(this.#currentCacheKey);
    if (cached) {
      cached.subscribers++;
      if (cached.gcTimeout) window.clearTimeout(cached.gcTimeout);
      cached.refetchers.add(this.localRefetch);
      cached.updateUIs.add(this.updateLocalUI);
      this.updateLocalUI(cached.data);
      this.#isLoading.set(false);

      if (Date.now() - cached.timestamp > this.#opts.staleTime!) {
        this.executeFetch(this.#currentCacheKey, keyArr);
      }
    } else {
      queryCache.set(this.#currentCacheKey, {
        data: null,
        timestamp: 0,
        subscribers: 1,
        refetchers: new Set([this.localRefetch]),
        updateUIs: new Set([this.updateLocalUI]),
        queryKey: keyArr,
      });
      this.executeFetch(this.#currentCacheKey, keyArr);
    }
  }

  unsubscribe() {
    const keyToCleanup = this.#currentCacheKey;
    if (!keyToCleanup) return;

    const cached = queryCache.get(keyToCleanup);
    if (cached) {
      cached.subscribers--;
      cached.refetchers.delete(this.localRefetch);
      cached.updateUIs.delete(this.updateLocalUI);
      if (cached.subscribers <= 0) {
        cached.gcTimeout = setTimeout(() => {
          queryCache.delete(keyToCleanup);
        }, this.#opts.gcTime);
      }
    }
    this.#currentCacheKey = '';
  }

  refetch = () => this.executeFetch(this.#currentCacheKey, this.#currentKeyArr);

  // Lit 组件挂载生命周期
  hostConnected() {
    // 监听 Key 或 enabled 的变更，微任务合并去重执行
    this.#stopEffect = createEffect(() => {
      this.#opts.queryKey();
      if (this.#opts.enabled) this.#opts.enabled();

      // 捕获到响应式依赖变更时：先清退旧订阅，再订阅新 Key
      if (this.#currentCacheKey) {
        if (this.#abortController) this.#abortController.abort();
        this.unsubscribe();
      }
      this.subscribe();
    });
  }

  // Lit 组件卸载生命周期：彻底销毁、防止 OOM 泄漏
  hostDisconnected() {
    if (this.#stopEffect) this.#stopEffect();
    if (this.#abortController) this.#abortController.abort();
    this.unsubscribe();
  }
}
