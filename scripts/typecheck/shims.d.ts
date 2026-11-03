// biome-ignore-all lint/suspicious/noExplicitAny: these types stand in for Svelte's runtime, which accepts anything in these places.
// biome-ignore-all lint/suspicious/noConfusingVoidType: an action may return nothing.
// biome-ignore-all lint/complexity/noBannedTypes: `{}` (any non-nullish value) is what these helpers return and default to; `object` would reject primitives.
// Ambient declarations for the helpers `emit.ts` calls in generated code.
// None of them runs; each exists so the checker infers what Svelte does at
// runtime. Adapted from svelte2tsx's svelte-shims-v4.d.ts (MIT,
// https://github.com/sveltejs/language-tools), keeping only what `emit.ts`
// uses and keeping its names, so generated code can be diffed against
// svelte2tsx's when parity drifts.

type SvelteAllProps = { [index: string]: any };
type SvelteStore<T> = {
  subscribe: (run: (value: T) => any, invalidate?: any) => any;
};
/** Spells out a mapped type, for readable error messages. */
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
type SvelteWithOptionalProps<Props, Keys extends keyof Props> = Omit<
  Props,
  Keys
> &
  Partial<Pick<Props, Keys>>;
type SveltePropsAnyFallback<Props> = {
  [K in keyof Props]: Props[K] extends never
    ? never
    : Props[K] extends undefined
      ? any
      : Props[K];
};
type SvelteSlotsAnyFallback<Slots> = {
  [K in keyof Slots]: {
    [S in keyof Slots[K]]: Slots[K][S] extends undefined ? any : Slots[K][S];
  };
};
type SvelteRender<Props, Events, Slots, Exports, Bindings> = {
  props: Props;
  events: Events;
  slots: Slots;
  exports?: Exports;
  bindings?: Bindings;
};

// --- Values: `any` stand-ins and the script's special variables.

declare function __sveltets_2_any(...dummy: any[]): any;
declare function __sveltets_2_empty(...dummy: any[]): {};
/** `$$props`. */
declare function __sveltets_2_allPropsType(): SvelteAllProps;
/** `$$restProps`. */
declare function __sveltets_2_restPropsType(): SvelteAllProps;
/** `$: x = expr` declares `x` with `expr`'s type. */
declare function __sveltets_2_invalidate<T>(getValue: () => T): T;
/** `$store`: the store's value. */
declare function __sveltets_2_store_get<T = any>(store: SvelteStore<T>): T;
declare function __sveltets_2_store_get<
  Store extends SvelteStore<any> | undefined | null,
>(store: Store): Store extends SvelteStore<infer T> ? T : Store;

// --- Markup.

/** `{#each}` accepts an array or iterable, and in Svelte 5 `null`. */
declare function __sveltets_2_ensureArray<
  T extends ArrayLike<unknown> | Iterable<unknown>,
>(
  array:
    | T
    | (typeof import("svelte") extends { mount: any }
        ? undefined | null
        : never),
): T extends ArrayLike<infer U>
  ? U[]
  : T extends Iterable<infer U>
    ? Iterable<U>
    : any[];

type __sveltets_2_SvelteActionReturnType = {
  update?: (args: any) => void;
  destroy?: () => void;
  $$_attributes?: Record<string, any>;
} | void;
/** `use:action`: what the action adds to the element's attributes. */
declare function __sveltets_2_ensureAction<
  T extends __sveltets_2_SvelteActionReturnType,
>(actionCall: T): T extends { $$_attributes?: any } ? T["$$_attributes"] : {};
/** Joins what several actions add to an element's attributes. */
declare function __sveltets_2_union<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  t1: T1,
  t2?: T2,
  t3?: T3,
  t4?: T4,
  t5?: T5,
  t6?: T6,
  t7?: T7,
  t8?: T8,
  t9?: T9,
  t10?: T10,
): T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10;

type __sveltets_2_SvelteTransitionConfig = {
  delay?: number;
  duration?: number;
  easing?: (t: number) => number;
  css?: (t: number, u: number) => string;
  tick?: (t: number, u: number) => void;
};
/** `transition:`, `in:` and `out:`. */
declare function __sveltets_2_ensureTransition(
  transitionCall:
    | __sveltets_2_SvelteTransitionConfig
    | (() => __sveltets_2_SvelteTransitionConfig),
): {};

// --- Events.

/** `createEventDispatcher<Typings>()`'s events, as `CustomEvent`s. */
declare function __sveltets_2_toEventTypings<Typings>(): {
  [Key in keyof Typings]: CustomEvent<Typings[Key]>;
};
/** A DOM event an element forwards with a bare `on:event`. */
declare function __sveltets_2_mapElementEvent<
  K extends keyof HTMLElementEventMap,
>(event: K): HTMLElementEventMap[K];

// --- Components.

declare type ATypedSvelteComponent = {
  $$prop_def: any;
  $$events_def: any;
  $$slot_def: any;
  $on(event: string, handler: any): () => void;
};
declare type ConstructorOfATypedSvelteComponent = new (args: {
  target: any;
  props?: any;
}) => ATypedSvelteComponent;
/**
 * A component to `new` with its props: a class component (sveld's `.d.ts`,
 * Svelte 3 and 4) as it is, a Svelte 5 function component as a class.
 */
declare function __sveltets_2_ensureComponent<
  T extends
    | ConstructorOfATypedSvelteComponent
    | (typeof import("svelte") extends { mount: any }
        ? // @ts-ignore svelte.Component doesn't exist in Svelte 4
          import("svelte").Component<any, any, any>
        : never)
    | null
    | undefined,
>(
  type: T,
): NonNullable<
  T extends ConstructorOfATypedSvelteComponent
    ? T
    : typeof import("svelte") extends { mount: any }
      ? // @ts-ignore svelte.Component doesn't exist in Svelte 4
        T extends import("svelte").Component<
          infer Props extends Record<string, any>,
          infer Exports extends Record<string, any>,
          infer Bindings extends string
        >
        ? new (
            options: import("svelte").ComponentConstructorOptions<Props>,
          ) => import("svelte").SvelteComponent<
            Props,
            Props["$$events"],
            Props["$$slots"]
          > &
            Exports & { $$bindings: Bindings }
        : never
      : never
>;

// --- What a generated component exports: `$$render()`'s props, events and
// slots, wrapped in turn.

/**
 * Props listed in `optionalProps` (those with a default) are optional. With
 * none, `emit.ts` leaves the list out: an empty one would make them all so.
 */
declare function __sveltets_2_partial<
  Props = {},
  Events = {},
  Slots = {},
  Exports = {},
  Bindings = string,
>(
  render: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): {
  props: Expand<SveltePropsAnyFallback<Props>>;
  events: Events;
  slots: Expand<SvelteSlotsAnyFallback<Slots>>;
  exports?: Exports;
  bindings?: Bindings;
};
declare function __sveltets_2_partial<
  Props = {},
  Events = {},
  Slots = {},
  Exports = {},
  Bindings = string,
  OptionalProps extends keyof Props = any,
>(
  optionalProps: OptionalProps[],
  render: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): {
  props: Expand<
    SvelteWithOptionalProps<SveltePropsAnyFallback<Props>, OptionalProps>
  >;
  events: Events;
  slots: Expand<SvelteSlotsAnyFallback<Slots>>;
  exports?: Exports;
  bindings?: Bindings;
};
/** `__sveltets_2_partial` for a component that reads `$$props` or `$$restProps`. */
declare function __sveltets_2_partial_with_any<
  Props = {},
  Events = {},
  Slots = {},
  Exports = {},
  Bindings = string,
>(
  render: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): {
  props: Expand<SveltePropsAnyFallback<Props> & SvelteAllProps>;
  events: Events;
  slots: Expand<SvelteSlotsAnyFallback<Slots>>;
  exports?: Exports;
  bindings?: Bindings;
};
declare function __sveltets_2_partial_with_any<
  Props = {},
  Events = {},
  Slots = {},
  Exports = {},
  Bindings = string,
  OptionalProps extends keyof Props = any,
>(
  optionalProps: OptionalProps[],
  render: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): {
  props: Expand<
    SvelteWithOptionalProps<SveltePropsAnyFallback<Props>, OptionalProps> &
      SvelteAllProps
  >;
  events: Events;
  slots: Expand<SvelteSlotsAnyFallback<Slots>>;
  exports?: Exports;
  bindings?: Bindings;
};
/** Any event name, with a `CustomEvent`. */
declare function __sveltets_2_with_any_event<
  Props = {},
  Events = {},
  Slots = {},
  Exports = {},
  Bindings = string,
>(
  render: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): {
  props: Props;
  events: Events & { [evt: string]: CustomEvent<any> };
  slots: Slots;
  exports?: Exports;
  bindings?: Bindings;
};

/** A component both `new`-able (Svelte 4) and callable (Svelte 5). */
interface __sveltets_2_IsomorphicComponent<
  Props extends Record<string, any> = any,
  Events extends Record<string, any> = any,
  Slots extends Record<string, any> = any,
  Exports = {},
  Bindings = string,
> {
  new (
    options: import("svelte").ComponentConstructorOptions<Props>,
  ): import("svelte").SvelteComponent<Props, Events, Slots> & {
    $$bindings?: Bindings;
  } & Exports;
  (
    internal: unknown,
    props: Props extends Record<string, never>
      ? { $$events?: Events; $$slots?: Slots }
      : Props & { $$events?: Events; $$slots?: Slots },
  ): Exports & { $set?: any; $on?: any };
  z_$$bindings?: Bindings;
}
declare function __sveltets_2_isomorphic_component<
  Props extends Record<string, any>,
  Events extends Record<string, any>,
  Slots extends Record<string, any>,
  Exports extends Record<string, any>,
  Bindings extends string,
>(
  klass: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): __sveltets_2_IsomorphicComponent<Props, Events, Slots, Exports, Bindings>;

/** A component with a default `<slot>` also takes a `children` prop. */
type __sveltets_2_PropsWithChildren<Props, Slots> = Props &
  (Slots extends { default: any }
    ? Props extends Record<string, never>
      ? any
      : { children?: any }
    : {});
declare function __sveltets_2_isomorphic_component_slots<
  Props extends Record<string, any>,
  Events extends Record<string, any>,
  Slots extends Record<string, any>,
  Exports extends Record<string, any>,
  Bindings extends string,
>(
  klass: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): __sveltets_2_IsomorphicComponent<
  __sveltets_2_PropsWithChildren<Props, Slots>,
  Events,
  Slots,
  Exports,
  Bindings
>;

/**
 * A component as Svelte 3 types one: a `SvelteComponentTyped` class, which
 * its `render()` typings infer props from. Svelte 3 has no function components.
 */
declare function __sveltets_2_svelte3_component<
  Props extends Record<string, any>,
  Events extends Record<string, any>,
  Slots extends Record<string, any>,
  Exports extends Record<string, any>,
  Bindings extends string,
>(
  klass: SvelteRender<Props, Events, Slots, Exports, Bindings>,
): new (
  options: import("svelte").ComponentConstructorOptions<Props>,
) => import("svelte").SvelteComponentTyped<Props, Events, Slots> & Exports;
