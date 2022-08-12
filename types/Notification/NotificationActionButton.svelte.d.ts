/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";
import type { ButtonProps } from "../Button/Button.svelte";

export interface NotificationActionButtonProps extends ButtonProps {}

export default class NotificationActionButton extends SvelteComponentTyped<
  NotificationActionButtonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
