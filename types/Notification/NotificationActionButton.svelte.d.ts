import { SvelteComponentTyped } from "svelte";
import type { ButtonProps } from "../Button/Button.svelte";

export type NotificationActionButtonProps = ButtonProps & {};

export default class NotificationActionButton extends SvelteComponentTyped<
  NotificationActionButtonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
