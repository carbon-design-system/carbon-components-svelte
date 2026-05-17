// Resolve from the active Vitest project (Svelte 5 vs compat workspaces).
const sveltePkg = await import("svelte/package.json");

const SVELTE_VERSION = Number.parseInt(sveltePkg.version.split(".")[0], 10);
export const isSvelte5 = SVELTE_VERSION === 5;
