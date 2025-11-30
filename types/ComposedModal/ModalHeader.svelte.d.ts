import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
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

  [key: `data-${string}`]: any;
};

export type ModalHeaderProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ModalHeader extends SvelteComponentTyped<
  ModalHeaderProps,
  { click: WindowEventMap["click"] },
  { default: Record<string, never> }
> {}
