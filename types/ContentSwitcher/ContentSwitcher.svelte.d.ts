import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type ContentSwitcherContext = {
  currentId: import("svelte/store").Writable<string | null>;
  add: (data: { id: string; text: string; selected: boolean }) => void;
  update: (id: string) => void;
  change: (direction: number) => void;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set the selected index of the switch item
   * @default 0
   */
  selectedIndex?: number;

  /**
   * Specify the size of the content switcher.
   * @default undefined
   */
  size?: "sm" | "xl";

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type ContentSwitcherProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ContentSwitcher extends SvelteComponentTyped<
  ContentSwitcherProps,
  {
    change: CustomEvent<number>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
