/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface RecursiveListNode {
  text?: string;
  href?: string;
  html?: string;
}

export interface RecursiveListProps {
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

  /**
   * Set to `true` to use the nested variant
   * @default false
   */
  nested?: boolean;
}

export default class RecursiveList extends SvelteComponentTyped<
  RecursiveListProps,
  {},
  {}
> {}
