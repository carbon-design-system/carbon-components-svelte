import { writable } from "svelte/store";
import type { Route } from "./routes";

/** Its own module, so a framed example can read it without the router. */
export const route = writable<Route | undefined>(undefined);
