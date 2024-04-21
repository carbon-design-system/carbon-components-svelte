import type { SvelteComponentTyped } from "svelte";

export type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps {}

export default class Heading extends SvelteComponentTyped<
  HeadingProps,
  Record<string, any>,
  { default: {} }
> {}
