import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type RecursiveListNode = {
  /** Node text content */
  text?: string;
  /** Node link URL */
  href?: string;
  /** Node HTML content */
  html?: string;
  /** Child nodes */
  nodes?: RecursiveListNode[];
};

type $RestProps = SvelteHTMLElements["ul"] & SvelteHTMLElements["ol"];

type $Props<Node extends RecursiveListNode = RecursiveListNode> = {
  /**
   * Specify the nodes to render.
   * @default []
   */
  nodes?: ReadonlyArray<Node & { nodes?: Node[] }>;

  /**
   * Specify the type of list to render.
   * @default "unordered"
   */
  type?: "unordered" | "ordered" | "ordered-native";

  [key: `data-${string}`]: any;
};

export type RecursiveListProps<
  Node extends RecursiveListNode = RecursiveListNode,
> = Omit<$RestProps, keyof $Props<Node>> & $Props<Node>;

export default class RecursiveList<
  Node extends RecursiveListNode = RecursiveListNode,
> extends SvelteComponentTyped<
  RecursiveListProps<Node>,
  Record<string, any>,
  Record<string, never>
> {}
