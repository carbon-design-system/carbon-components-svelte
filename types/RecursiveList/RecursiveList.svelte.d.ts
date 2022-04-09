/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface RecursiveListNode {
  text?: string;
  href?: string;
  html?: string;
}

export interface RecursiveListProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ul"]>,
    svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["ol"]> {
  /**
   * Specify the children to render
   * @default []
   */
  children?: Array<RecursiveListNode & { children?: RecursiveListNode[] }>;

  /**
   * Specify the type of list to render
   * @default "unordered"
   */
  type?: "unordered" | "ordered" | "ordered-native";
}

export default class RecursiveList extends SvelteComponentTyped<
  RecursiveListProps,
  {},
  {}
> {}
