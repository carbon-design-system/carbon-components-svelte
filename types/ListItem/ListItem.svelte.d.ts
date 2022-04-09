/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ListItemProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {}

export default class ListItem extends SvelteComponentTyped<
  ListItemProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
