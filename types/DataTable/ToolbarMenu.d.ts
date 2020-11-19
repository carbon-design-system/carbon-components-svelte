/// <reference types="svelte" />
import { OverflowMenuProps } from "../OverflowMenu/OverflowMenu";

export interface ToolbarMenuProps extends OverflowMenuProps {}

export default class ToolbarMenu {
  $$prop_def: ToolbarMenuProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
