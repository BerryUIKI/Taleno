import { createSignal, ErrorBoundary, lazy, type Component, type ComponentProps } from "solid-js";
import { createDynamic } from "solid-js/web";

export function lazyWithRetry<T extends Component<any>>(load: () => Promise<{ default: T }>): T {
  const wrapped: Component<Parameters<T>[0]> = props => {
    const [loaded, setLoaded] = createSignal<T>(lazy(load));
    return <ErrorBoundary fallback={(_error, reset) => (
      <div role="alert" class="p-6">
        <p>Unable to load this view. Your document remains open.</p>
        <button onClick={() => { setLoaded(() => lazy(load)); reset(); }}>Retry loading</button>
      </div>
    )}>
      {createDynamic(loaded, props as ComponentProps<T>)}
    </ErrorBoundary>;
  };
  return wrapped as T;
}
