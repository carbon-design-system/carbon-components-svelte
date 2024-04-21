import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["li"];

export interface ListItemProps extends RestProps {
  [key: `data-${string}`]: any;
}

export default class ListItem extends SvelteComponentTyped<
  ListItemProps,
  Record<string, any>,
  { default: {} }
> {}
