import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export interface RecursiveListNode {
  text?: string;
  href?: string;
  html?: string;
}

type RestProps = SvelteHTMLElements["ul"] & SvelteHTMLElements["ol"];

export interface RecursiveListProps extends RestProps {
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

  [key: `data-${string}`]: any;
}

export default class RecursiveList extends SvelteComponentTyped<
  RecursiveListProps,
  Record<string, any>,
  {}
> {}
