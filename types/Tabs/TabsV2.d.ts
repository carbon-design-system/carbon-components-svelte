/// <reference types="svelte" />

export type TabsV2ItemId = number | string;

export interface TabsV2Item {
  id: TabsV2ItemId;
  label?: string;
  disabled?: boolean;
}

export interface TabsV2Props extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Provide the tab items
   * @default []
   */
  items?: TabsV2Item[];

  /**
   * Specify the selected tab index
   * @default 0
   */
  selectedIndex?: number;

  /**
   * Specify the selected tab id
   */
  selectedId?: TabsV2ItemId;

  /**
   * Specify the type of tabs
   * @default "default"
   */
  type?: "default" | "container";

  /**
   * Specify the ARIA label for the chevron icon
   * @default "Show menu options"
   */
  iconDescription?: string;

  /**
   * Specify the tab trigger href attribute
   * @default "#"
   */
  triggerHref?: string;
}

export default class TabsV2 {
  $$prop_def: TabsV2Props;
  $$slot_def: {
    default: { id: TabsV2ItemId; index: number; item: TabsV2Item };
    tab: {};
  };

  $on(
    eventname: "change",
    cb: (event: CustomEvent<{ selectedIndex: number; selectedId: TabsV2ItemId; currentItem: TabsV2Item }>) => void
  ): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
