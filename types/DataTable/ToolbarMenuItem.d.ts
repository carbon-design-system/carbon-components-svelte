/// <reference types="svelte" />
import { OverflowMenuItemProps } from "../OverflowMenu/OverflowMenuItem";

export interface ToolbarMenuItemProps extends OverflowMenuItemProps {}

export default class ToolbarMenuItem {
  $$prop_def: ToolbarMenuItemProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
