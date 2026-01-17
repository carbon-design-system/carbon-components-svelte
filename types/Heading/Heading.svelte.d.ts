import { SvelteComponentTyped } from "svelte";

export type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingProps = {
  children?: (this: void) => void;
};

export default class Heading extends SvelteComponentTyped<
  HeadingProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
