/**
 * A component a prop such as `icon` renders: a Svelte 5 function component
 * or a Svelte 3 or 4 component class, so icons from `carbon-icons-svelte`
 * fit either way. `null` renders nothing, as with `<svelte:component>`.
 */
export type IconComponent =
  // biome-ignore lint/suspicious/noExplicitAny: `<svelte:component>` takes any component class or function, whatever its props.
  (new (...args: any[]) => any) | ((...args: any[]) => any) | null;
