// @fuyeor/query/src/MutationController.ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { Signal } from 'signal-polyfill';

export interface MutateOptions<TData, TError, TVariables, TContext> {
  onSuccess?: (data: TData, variables: TVariables, context?: TContext) => void;
  onError?: (error: TError, variables: TVariables, context?: TContext) => void;
  onSettled?: (data?: TData, error?: TError, variables?: TVariables, context?: TContext) => void;
}

interface MutationOptions<TData, TError, TVariables, TContext> extends MutateOptions<
  TData,
  TError,
  TVariables,
  TContext
> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
}

export class MutationController<
  TData = any,
  TError = any,
  TVariables = void,
  TContext = unknown,
> implements ReactiveController {
  #isPending = new Signal.State(false);
  #isSuccess = new Signal.State(false);
  #isError = new Signal.State(false);
  #error = new Signal.State<TError | null>(null);
  #data = new Signal.State<TData | null>(null);

  constructor(
    host: ReactiveControllerHost,
    private options: MutationOptions<TData, TError, TVariables, TContext>,
  ) {
    host.addController(this);
  }

  get isPending() {
    return this.#isPending.get();
  }
  get isSuccess() {
    return this.#isSuccess.get();
  }
  get isError() {
    return this.#isError.get();
  }
  get error() {
    return this.#error.get();
  }
  get data() {
    return this.#data.get();
  }

  mutate = async (
    variables: TVariables,
    mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>,
  ) => {
    this.#isPending.set(true);
    this.#isError.set(false);
    this.#isSuccess.set(false);

    let context: TContext | undefined;

    try {
      if (this.options.onMutate) {
        context = await this.options.onMutate(variables);
      }
      const res = await this.options.mutationFn(variables);
      this.#data.set(res);
      this.#isSuccess.set(true);

      if (this.options.onSuccess) this.options.onSuccess(res, variables, context);
      if (mutateOptions?.onSuccess) mutateOptions.onSuccess(res, variables, context);
      return res;
    } catch (err: any) {
      this.#isError.set(true);
      this.#error.set(err);
      if (this.options.onError) this.options.onError(err, variables, context);
      if (mutateOptions?.onError) mutateOptions.onError(err, variables, context);
      throw err;
    } finally {
      this.#isPending.set(false);
      if (this.options.onSettled)
        this.options.onSettled(
          this.#data.get() ?? undefined,
          this.#error.get() ?? undefined,
          variables,
          context,
        );
      if (mutateOptions?.onSettled)
        mutateOptions.onSettled(
          this.#data.get() ?? undefined,
          this.#error.get() ?? undefined,
          variables,
          context,
        );
    }
  };

  mutateAsync = this.mutate;

  reset = () => {
    this.#isPending.set(false);
    this.#isSuccess.set(false);
    this.#isError.set(false);
    this.#error.set(null);
    this.#data.set(null);
  };

  hostConnected() {}
  hostDisconnected() {}
}
