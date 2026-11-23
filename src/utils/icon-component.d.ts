/**
 * A component a prop such as `icon` renders: a Svelte 5 function component
 * or a Svelte 3 or 4 component class, so icons from `carbon-icons-svelte`
 * fit either way. `null` renders nothing, as with `<svelte:component>`.
 */
export type IconComponent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `<svelte:component>` takes any component class or function, whatever its props.
  (new (...args: any[]) => any) | ((...args: any[]) => any) | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- An icon whose props can't be read takes any props.
type AnyProps = Record<string, any>;

/**
 * The props an `IconComponent` takes, for a prop such as `iconProps` that
 * passes them through. Falls back to any props when they can't be read: an
 * `any` icon, or a Svelte 3 icon, whose `SvelteComponent` isn't generic.
 */
export type IconComponentProps<T> = 0 extends 1 & T
  ? AnyProps
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Matches any constructor's arguments.
    T extends new (...args: any[]) => { $$prop_def: infer P }
    ? KnownProps<P>
    : T extends (internals: never, props: infer P) => unknown
      ? KnownProps<P>
      : AnyProps;

type KnownProps<P> = unknown extends P ? AnyProps : P;
