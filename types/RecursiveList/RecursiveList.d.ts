/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface Item {
  text?: string;
  href?: string;
  html?: string;
}

export interface RecursiveListProps {
  /**
   * Specify the items to render
   * @default []
   */
  items?: Array<Item & { items?: Item[] }>;

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
