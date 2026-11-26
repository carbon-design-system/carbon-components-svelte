export const lazyPortalTooltip: import("svelte/store").Readable<
  typeof import("./PortalTooltip.svelte").default | null
> & { load(): void };
