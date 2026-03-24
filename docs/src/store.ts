import type { CarbonTheme } from "carbon-components-svelte/src/Theme/Theme.svelte";
import { writable } from "svelte/store";

export const theme = writable<CarbonTheme>("white");
