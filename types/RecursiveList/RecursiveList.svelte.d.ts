import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export interface RecursiveListNode {
  text?: string;
  href?: string;
  html?: string;
}

type $RestProps = SvelteHTMLElements["ul"] & SvelteHTMLElements["ol"];

type $Props = {
  /**
   * Specify the nodes to render
   * @default []
   */
  nodes?: Array<RecursiveListNode & { nodes?: RecursiveListNode[] }>;

  /**
   * Specify the type of list to render
   * @default "unordered"
   */
  type?: "unordered" | "ordered" | "ordered-native";

  [key: `data-${string}`]: any;
};

export type RecursiveListProps = Omit<$RestProps, keyof $Props> & $Props;

export default class RecursiveList extends SvelteComponentTyped<
  RecursiveListProps,
  Record<string, any>,
  {}
> {}
