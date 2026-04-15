// @fuyeor/query/src/QueryController.spec.ts
// pnpm -F @fuyeor/query test QueryController.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Signal } from 'signal-polyfill';
import {
  queryCache,
  hashQueryKey,
  QueryController,
  InfiniteQueryController,
  useQueryClient,
  MutationController,
} from './index';
import { ReactiveControllerHost } from 'lit';

// Helper to flush signal watcher microtasks
const flush = () =>
  new Promise<void>((resolve) => {
    window.queueMicrotask(() => resolve());
  });

// Mock Lit Host
const createMockHost = (): ReactiveControllerHost => ({
  addController: vi.fn(),
  removeController: vi.fn(),
  requestUpdate: vi.fn(),
  updateComplete: Promise.resolve(true),
});

class HttpError extends Error {
  constructor(
    public status: number,
    public message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

describe('@fuyeor/query Core Behavior Tests', () => {
  beforeEach(() => {
    queryCache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Basic fetch and isEmpty business state', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const host = createMockHost();
    const query = new QueryController(host, {
      queryKey: () => ['test-empty'],
      queryFn: fetcher,
    });

    query.hostConnected();
    expect(query.isLoading).toBe(true);

    await flush();
    await flush();

    expect(query.isLoading).toBe(false);
    expect(query.data).toEqual([]);
    expect(query.isEmpty).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('StaleTime cache hit (No duplicate requests)', async () => {
    const fetcher = vi.fn().mockResolvedValue('fuyeor');
    const host = createMockHost();

    // First instance
    const q1 = new QueryController(host, {
      queryKey: () => ['cache-test'],
      queryFn: fetcher,
      staleTime: 5000,
    });
    q1.hostConnected();
    await flush();

    // Advance time by 2s (within staleTime)
    vi.advanceTimersByTime(2000);

    // Second instance
    const q2 = new QueryController(host, {
      queryKey: () => ['cache-test'],
      queryFn: fetcher,
      staleTime: 5000,
    });
    q2.hostConnected();
    await flush();

    expect(q2.isLoading).toBe(false);
    expect(q2.data).toBe('fuyeor');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('useQueryClient.invalidateQueries forced refresh', async () => {
    let responseData = 'old_data';
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(responseData));
    const host = createMockHost();

    const query = new QueryController(host, {
      queryKey: () => ['thoughts'],
      queryFn: fetcher,
      staleTime: 99999,
    });
    query.hostConnected();
    await flush();

    responseData = 'new_data';
    const queryClient = useQueryClient();

    // Trigger invalidation
    queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    await flush();
    await flush();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(['thoughts'])).toBe('new_data');
  });

  it('Retry mechanism with delay', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValueOnce('success');

    const host = createMockHost();
    const query = new QueryController(host, {
      queryKey: () => ['retry-test'],
      queryFn: fetcher,
      retry: 1,
      retryDelay: 100,
    });

    query.hostConnected();
    await flush();
    expect(query.data).toBeNull();

    vi.advanceTimersByTime(150);
    await flush();
    await flush();

    expect(query.isError).toBe(false);
    expect(query.data).toBe('success');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('Dynamic enabled toggle with Signals', async () => {
    const fetcher = vi.fn().mockResolvedValue('translated');
    const isEnabled = new Signal.State(false);
    const host = createMockHost();

    const query = new QueryController(host, {
      queryKey: () => ['translation-test'],
      queryFn: fetcher,
      enabled: () => isEnabled.get(),
    });

    query.hostConnected();
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(0);

    // Trigger Signal change
    isEnabled.set(true);
    await flush();
    await flush();

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(query.data).toBe('translated');
  });

  it('GC (Garbage Collection) mechanism', async () => {
    const fetcher = vi.fn().mockResolvedValue('gc-data');
    const cacheKey = hashQueryKey(['gc-test']);
    const host = createMockHost();

    const query = new QueryController(host, {
      queryKey: () => ['gc-test'],
      queryFn: fetcher,
      gcTime: 1000 * 60 * 5,
    });

    query.hostConnected();
    await flush();
    expect(queryCache.has(cacheKey)).toBe(true);

    // Simulate unmount
    query.hostDisconnected();

    vi.advanceTimersByTime(1000 * 60 * 4);
    expect(queryCache.has(cacheKey)).toBe(true);

    vi.advanceTimersByTime(1000 * 60 * 1 + 1000);
    expect(queryCache.has(cacheKey)).toBe(false);
  });

  it('Watcher reactivity (Dynamic Key change)', async () => {
    const id = new Signal.State(1);
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(`data-${id.get()}`));
    const host = createMockHost();

    const query = new QueryController(host, {
      queryKey: () => ['test', id.get()],
      queryFn: fetcher,
    });

    query.hostConnected();
    await flush();
    expect(query.data).toBe('data-1');

    // Change ID Signal
    id.set(2);
    await flush();
    await flush();

    expect(query.data).toBe('data-2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('Request de-duplication (Race condition prevention)', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(
        () => new Promise((res) => window.setTimeout(() => res('shared-data'), 100)),
      );

    const host = createMockHost();
    const q1 = new QueryController(host, { queryKey: () => ['shared'], queryFn: fetcher });
    const q2 = new QueryController(host, { queryKey: () => ['shared'], queryFn: fetcher });

    q1.hostConnected();
    q2.hostConnected();

    vi.advanceTimersByTime(150);
    await flush();

    expect(q1.data).toBe('shared-data');
    expect(q2.data).toBe('shared-data');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('Select function transformation', async () => {
    const fetcher = vi.fn().mockResolvedValue({ name: 'fuyeor', age: 18 });
    const host = createMockHost();

    const query = new QueryController(host, {
      queryKey: () => ['select-test'],
      queryFn: fetcher,
      select: (res) => res.name.toUpperCase(),
    });

    query.hostConnected();
    await flush();

    expect(query.data).toBe('FUYEOR');
    const cached = queryCache.get(hashQueryKey(['select-test']));
    expect(cached!.data).toEqual({ name: 'fuyeor', age: 18 });
  });

  it('Semantic isNotFound identification', async () => {
    const fetcher = vi.fn().mockRejectedValue(new HttpError(404, 'Not Found'));
    const host = createMockHost();

    const query = new QueryController(host, {
      queryKey: () => ['404-test'],
      queryFn: fetcher,
    });

    query.hostConnected();
    await flush();

    expect(query.isError).toBe(true);
    expect(query.isNotFound).toBe(true);
    expect(query.status).toBe('not-found');
  });

  it('Semantic status priorities (isSuccess vs isRetrieved)', async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    const host = createMockHost();

    const query = new QueryController(host, {
      queryKey: () => ['semantic-test'],
      queryFn: fetcher,
    });

    query.hostConnected();
    await flush();

    expect(query.isSuccess).toBe(true);
    expect(query.isEmpty).toBe(true);
    expect(query.isRetrieved).toBe(false);
    expect(query.status).toBe('empty');
  });

  it('Mutation Controller functionality', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });
    const onSuccess = vi.fn();
    const host = createMockHost();

    const mutation = new MutationController(host, { mutationFn, onSuccess });

    await mutation.mutate({ title: 'New Note' });

    expect(mutation.isSuccess).toBe(true);
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, { title: 'New Note' }, undefined);
  });

  it('Infinite Query toggle and fetching', async () => {
    const fetcher = vi.fn().mockResolvedValue(['img1']);
    const isEnabled = new Signal.State(false);
    const host = createMockHost();

    const infinite = new InfiniteQueryController(host, {
      queryKey: () => ['media-test'],
      queryFn: fetcher,
      enabled: () => isEnabled.get(),
      getNextPageParam: () => null,
    });

    infinite.hostConnected();
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(0);

    isEnabled.set(true);
    await flush();
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(infinite.pages).toHaveLength(1);
  });
});
