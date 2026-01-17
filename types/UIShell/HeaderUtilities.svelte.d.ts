import { SvelteComponentTyped } from "svelte";

export type HeaderUtilitiesProps = {
  children?: (this: void) => void;
};

export default class HeaderUtilities extends SvelteComponentTyped<
  HeaderUtilitiesProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
