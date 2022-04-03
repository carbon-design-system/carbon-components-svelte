/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface SearchProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["svg"]> {
  /**
   * @default 16
   */
  size?: number;

  /**
   * @default undefined
   */
  title?: undefined;
}

export default class Search extends SvelteComponentTyped<SearchProps, {}, {}> {}
