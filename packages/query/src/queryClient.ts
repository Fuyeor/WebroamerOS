// @fuyeor/query/src/queryClient.ts
import { Signal } from 'signal-polyfill';

export interface QueryCacheEntry<T> {
  data: T | null;
  timestamp: number;
  subscribers: number;
  gcTimeout?: ReturnType<typeof window.setTimeout>;
  refetchers: Set<() => void>;
  updateUIs: Set<(newData: any) => void>;
  queryKey: readonly unknown[];
}

export const queryCache = new Map<string, QueryCacheEntry<any>>();

export const QUERY_DEFAULT_OPTIONS = {
  staleTime: 1000 * 5,
  gcTime: 1000 * 60 * 5,
  retry: 0,
  retryDelay: 1000,
};

const queryBC = new window.BroadcastChannel('fuyeorQueryBC');

/**
 * Lit 环境生成缓存 Key (由于限制了必须传入纯净数组，直接 JSON 序列化即可)
 */
export const hashQueryKey = (queryKey: readonly unknown[]): string => {
  return JSON.stringify(queryKey);
};

const isPrefix = (prefix: readonly unknown[], target: readonly unknown[]): boolean => {
  if (prefix.length > target.length) return false;
  return prefix.every((val, i) => JSON.stringify(val) === JSON.stringify(target[i]));
};

/**
 * 专为 TC39 Signals 打造的微型 Effect 引擎 (极速、低内存)
 * 用于追踪 queryKey 和 enabled 的变化并触发重载
 */
export function createEffect(fn: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);

  // 核心计算节点，闭包捕获用户逻辑
  const node = new Signal.Computed(() => {
    if (cleanup) cleanup();
    cleanup = fn();
  });

  const watcher = new Signal.subtle.Watcher(() => {
    // 放入微任务队列，合并多次同步的 Signal 变更
    window.queueMicrotask(() => {
      for (const sig of watcher.getPending()) sig.get();
      watcher.watch();
    });
  });

  watcher.watch(node);
  node.get(); // 首次启动追踪

  return () => {
    watcher.unwatch(node);
    if (cleanup) cleanup();
  };
}

export function useQueryClient() {
  const client = {
    invalidateQueries: (filters: { queryKey: readonly unknown[] }, fromRemote = false) => {
      const prefix = filters.queryKey;
      queryCache.forEach((entry) => {
        if (isPrefix(prefix, entry.queryKey)) {
          entry.timestamp = 0;
          entry.refetchers.forEach((refetch) => refetch());
        }
      });
      if (!fromRemote) queryBC.postMessage({ type: 'invalidate', key: prefix });
    },

    setQueryData: <TData>(
      queryKey: readonly unknown[],
      updater: TData | ((oldData: TData | undefined) => TData),
    ) => {
      const hash = hashQueryKey(queryKey);
      const entry = queryCache.get(hash);
      const newData = typeof updater === 'function' ? (updater as Function)(entry?.data) : updater;

      if (entry) {
        entry.data = newData;
        entry.timestamp = Date.now();
        entry.updateUIs.forEach((update) => update(newData));
      } else {
        queryCache.set(hash, {
          data: newData,
          timestamp: Date.now(),
          subscribers: 0,
          refetchers: new Set(),
          updateUIs: new Set(),
          queryKey,
        });
      }
    },

    getQueryData: (queryKey: unknown[]) => {
      return queryCache.get(hashQueryKey(queryKey as readonly unknown[]))?.data;
    },

    removeQueries: (filters: { queryKey: readonly unknown[] }) => {
      const prefix = filters.queryKey;
      queryCache.forEach((entry, hash) => {
        if (isPrefix(prefix, entry.queryKey)) {
          if (entry.gcTimeout) window.clearTimeout(entry.gcTimeout);
          queryCache.delete(hash);
        }
      });
    },
  };

  queryBC.onmessage = (event) => {
    if (event.data.type === 'invalidate') {
      client.invalidateQueries({ queryKey: event.data.key }, true);
    }
  };

  return client;
}
