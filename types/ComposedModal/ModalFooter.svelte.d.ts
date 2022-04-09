/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ModalFooterProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the primary button text
   * @default ""
   */
  primaryButtonText?: string;

  /**
   * Specify the primary button icon
   * @default undefined
   */
  primaryButtonIcon?: typeof import("svelte").SvelteComponent;

  /**
   * Set to `true` to disable the primary button
   * @default false
   */
  primaryButtonDisabled?: boolean;

  /**
   * Specify a class for the primary button
   * @default undefined
   */
  primaryClass?: string;

  /**
   * Specify the secondary button text
   * @default ""
   */
  secondaryButtonText?: string;

  /**
   * 2-tuple prop to render two secondary buttons for a 3 button modal
   * supersedes `secondaryButtonText`
   * @default []
   */
  secondaryButtons?: [{ text: string }, { text: string }];

  /**
   * Specify a class for the secondary button
   * @default undefined
   */
  secondaryClass?: string;

  /**
   * Set to `true` to use the danger variant
   * @default false
   */
  danger?: boolean;
}

export default class ModalFooter extends SvelteComponentTyped<
  ModalFooterProps,
  { ["click:button--secondary"]: CustomEvent<{ text: string }> },
  { default: {} }
> {}
