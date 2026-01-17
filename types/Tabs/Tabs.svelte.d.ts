import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type TabsContext = {
  tabs: import("svelte/store").Writable<
    ReadonlyArray<{
      id: string;
      label: string;
      disabled: boolean;
      index: number;
    }>
  >;
  contentById: import("svelte/store").Readable<
    Record<string, { id: string; index: number }>
  >;
  selectedTab: import("svelte/store").Writable<string | undefined>;
  selectedContent: import("svelte/store").Writable<string | undefined>;
  useAutoWidth: import("svelte/store").Writable<boolean>;
  add: (data: { id: string; label: string; disabled: boolean }) => void;
  remove: (id: string) => void;
  addContent: (data: { id: string }) => void;
  removeContent: (id: string) => void;
  update: (id: string) => void;
  change: (direction: number) => Promise<void>;
};

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the selected tab index
   * @default 0
   */
  selected?: number;

  /**
   * Specify the type of tabs.
   * @default "default"
   */
  type?: "default" | "container";

  /**
   * Set to `true` for tabs to have an auto-width
   * @default false
   */
  autoWidth?: boolean;

  /**
   * Specify the ARIA label for the chevron icon.
   * @default "Show menu options"
   */
  iconDescription?: string;

  /**
   * Specify the tab trigger href attribute
   * @default "#"
   */
  triggerHref?: string;

  content?: (this: void) => void;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type TabsProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Tabs extends SvelteComponentTyped<
  TabsProps,
  {
    change: CustomEvent<number>;
    keypress: WindowEventMap["keypress"];
    click: WindowEventMap["click"];
  },
  { default: Record<string, never>; content: Record<string, never> }
> {}
