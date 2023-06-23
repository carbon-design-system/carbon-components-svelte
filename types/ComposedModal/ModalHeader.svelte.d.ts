/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";

export interface ModalHeaderProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the modal title
   * @default ""
   */
  title?: string;

  /**
   * Specify the modal label
   * @default ""
   */
  label?: string;

  /**
   * Specify the label class
   * @default ""
   */
  labelClass?: string;

  /**
   * Specify the title class
   * @default ""
   */
  titleClass?: string;

  /**
   * Specify the close class
   * @default ""
   */
  closeClass?: string;

  /**
   * Specify the close icon class
   * @default ""
   */
  closeIconClass?: string;

  /**
   * Specify the ARIA label for the close icon
   * @default "Close"
   */
  iconDescription?: string;
}

export default class ModalHeader extends SvelteComponent<
  ModalHeaderProps,
  { click: WindowEventMap["click"] },
  { default: {} }
> {}
