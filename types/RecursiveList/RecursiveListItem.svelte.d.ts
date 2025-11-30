import { SvelteComponentTyped } from "svelte";

export type RecursiveListItemProps = {
  /**
   * Specify the text to render
   * @default ""
   */
  text?: string;

  /**
   * Specify a link href
   * @default ""
   */
  href?: string;

  /**
   * Specify HTML to render using `@html`
   * @default ""
   */
  html?: string;
};

export default class RecursiveListItem extends SvelteComponentTyped<
  RecursiveListItemProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
