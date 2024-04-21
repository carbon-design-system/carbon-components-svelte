import type { Action } from "svelte/action";

interface TruncateOptions {
  clamp?: "end" | "front";
}

export declare const truncate: Action<HTMLElement, TruncateOptions>;

export default truncate;
