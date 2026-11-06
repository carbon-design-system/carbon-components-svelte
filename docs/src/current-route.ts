import { writable } from "svelte/store";
import type { Route } from "./routes";

/**
 * The route whose page is showing, set once it has loaded. Its own module,
 * so a framed example can read it without loading the router.
 */
export const route = writable<Route | undefined>(undefined);
