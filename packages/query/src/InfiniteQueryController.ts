// @fuyeor/query/src/InfiniteQueryController.ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { Signal } from 'signal-polyfill';
import { queryCache, hashQueryKey, QUERY_DEFAULT_OPTIONS, createEffect } from './queryClient';

export interface InfiniteQueryFunctionContext {
  pageParam: any;
  signal: AbortSignal;
}

export interface InfiniteQueryOptions<TData, TError, TResult, TQueryKey, TPageParam> {
  queryKey: () => readonly unknown[];
  queryFn: (context: InfiniteQueryFunctionContext) => Promise<TData>;
  getNextPageParam: (lastPage: TData, allPages: TData[]) => any;
  initialPageParam?: any;
  select?: (data: { pages: TData[] }) => TResult;
  staleTime?: number;
  gcTime?: number;
  enabled?: () => boolean;
}

export class InfiniteQueryController<
  TData = any,
  TError = any,
  TResult = { pages: TData[] },
  TQueryKey = any,
  TPageParam = any,
> implements ReactiveController {
  #opts: typeof QUERY_DEFAULT_OPTIONS &
    InfiniteQueryOptions<TData, TError, TResult, TQueryKey, TPageParam>;

  #pages = new Signal.State<TData[]>([]);
  #data = new Signal.State<TResult | null>(null);
  #isLoading = new Signal.State(false);
  #isFetchingNextPage = new Signal.State(false);
  #hasNextPage = new Signal.State(true);
  #isError = new Signal.State(false);

  #currentPageParam: any;
  #currentCacheKey = '';
  #abortController: AbortController | null = null;
  #stopEffect: (() => void) | null = null;

  constructor(
    host: ReactiveControllerHost,
    options: InfiniteQueryOptions<TData, TError, TResult, TQueryKey, TPageParam>,
  ) {
    if (typeof options.queryKey !== 'function') throw new TypeError('queryKey must be a function');
    this.#opts = { ...QUERY_DEFAULT_OPTIONS, ...options };
    this.#currentPageParam = this.#opts.initialPageParam;
    host.addController(this);
  }

  get pages() {
    return this.#pages.get();
  }
  get data() {
    return this.#data.get();
  }
  get isLoading() {
    return this.#isLoading.get();
  }
  get isFetchingNextPage() {
    return this.#isFetchingNextPage.get();
  }
  get hasNextPage() {
    return this.#hasNextPage.get();
  }
  get isError() {
    return this.#isError.get();
  }

  refetch = async () => {
    this.#pages.set([]);
    this.#data.set(null);
    this.#currentPageParam = this.#opts.initialPageParam;
    this.#hasNextPage.set(true);
    await this.fetchNextPage();
  };

  fetchNextPage = async () => {
    if (!this.#hasNextPage.get() || this.#isFetchingNextPage.get()) return;

    if (this.#pages.get().length === 0) this.#isLoading.set(true);
    else this.#isFetchingNextPage.set(true);
    this.#isError.set(false);

    if (this.#abortController) this.#abortController.abort();
    this.#abortController = new AbortController();

    try {
      const newPage = await this.#opts.queryFn({
        pageParam: this.#currentPageParam,
        signal: this.#abortController.signal,
      });
      const newPages = [...this.#pages.get(), newPage];
      this.#pages.set(newPages);

      if (this.#opts.select) {
        this.#data.set(this.#opts.select({ pages: newPages }));
      } else {
        this.#data.set({ pages: newPages } as any);
      }

      const hash = hashQueryKey(this.#opts.queryKey());
      const entry = queryCache.get(hash);
      if (entry) {
        entry.data = this.#data.get();
        entry.timestamp = Date.now();
      }

      const nextParam = this.#opts.getNextPageParam(newPage, newPages);
      if (nextParam !== undefined && nextParam !== null) {
        this.#currentPageParam = nextParam;
        this.#hasNextPage.set(true);
      } else {
        this.#hasNextPage.set(false);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') this.#isError.set(true);
    } finally {
      this.#isLoading.set(false);
      this.#isFetchingNextPage.set(false);
    }
  };

  subscribe() {
    const isEnabled = this.#opts.enabled ? this.#opts.enabled() : true;
    if (!isEnabled) return;

    const keyArr = this.#opts.queryKey();
    this.#currentCacheKey = hashQueryKey(keyArr);

    const entry = queryCache.get(this.#currentCacheKey);
    if (entry) {
      entry.subscribers++;
      entry.refetchers.add(this.refetch);
    } else {
      queryCache.set(this.#currentCacheKey, {
        data: null,
        timestamp: 0,
        subscribers: 1,
        refetchers: new Set([this.refetch]),
        updateUIs: new Set(),
        queryKey: keyArr,
      });
    }
    this.fetchNextPage();
  }

  unsubscribe() {
    if (!this.#currentCacheKey) return;
    const entry = queryCache.get(this.#currentCacheKey);
    if (entry) {
      entry.subscribers--;
      entry.refetchers.delete(this.refetch);
      if (entry.subscribers <= 0) {
        window.setTimeout(() => queryCache.delete(this.#currentCacheKey), this.#opts.gcTime);
      }
    }
  }

  hostConnected() {
    this.#stopEffect = createEffect(() => {
      this.#opts.queryKey();
      if (this.#opts.enabled) this.#opts.enabled();

      if (this.#currentCacheKey) {
        this.unsubscribe();
        if (this.#abortController) this.#abortController.abort();
      }
      this.subscribe();
    });
  }

  hostDisconnected() {
    if (this.#stopEffect) this.#stopEffect();
    if (this.#abortController) this.#abortController.abort();
    this.unsubscribe();
  }
}
