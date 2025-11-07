import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["li"];

type $Props = {
  [key: `data-${string}`]: any;
};

export type ListItemProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ListItem extends SvelteComponentTyped<
  ListItemProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
