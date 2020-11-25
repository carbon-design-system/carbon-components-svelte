/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface NotificationActionButtonProps {}

export default class NotificationActionButton extends SvelteComponent<
  NotificationActionButtonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
