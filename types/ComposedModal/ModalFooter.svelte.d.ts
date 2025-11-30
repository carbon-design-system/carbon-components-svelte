import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the primary button text
   * @default ""
   */
  primaryButtonText?: string;

  /**
   * Specify the primary button icon.
   * @default undefined
   */
  primaryButtonIcon?: any;

  /**
   * Set to `true` to disable the primary button
   * @default false
   */
  primaryButtonDisabled?: boolean;

  /**
   * Specify a class for the primary button.
   * @default undefined
   */
  primaryClass?: string;

  /**
   * Specify the secondary button text
   * @default ""
   */
  secondaryButtonText?: string;

  /**
   * 2-tuple prop to render two secondary buttons for a 3 button modal.
   * Supersedes `secondaryButtonText`.
   * @default []
   */
  secondaryButtons?: [] | [{ text: string }, { text: string }];

  /**
   * Specify a class for the secondary button.
   * @default undefined
   */
  secondaryClass?: string;

  /**
   * Set to `true` to use the danger variant
   * @default false
   */
  danger?: boolean;

  [key: `data-${string}`]: any;
};

export type ModalFooterProps = Omit<$RestProps, keyof $Props> & $Props;

export default class ModalFooter extends SvelteComponentTyped<
  ModalFooterProps,
  { "click:button--secondary": CustomEvent<{ text: string }> },
  { default: Record<string, never> }
> {}
