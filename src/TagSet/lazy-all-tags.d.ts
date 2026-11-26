export const lazyAllTags: import("svelte/store").Readable<
  typeof import("./TagSetAllTags.svelte").default | null
> & { load(): void };
