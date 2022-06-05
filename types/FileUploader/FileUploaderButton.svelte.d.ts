/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface FileUploaderButtonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["input"]> {
  /**
   * Specify the accepted file types
   * @default []
   */
  accept?: ReadonlyArray<string>;

  /**
   * Obtain a reference to the uploaded files
   * @default []
   */
  files?: ReadonlyArray<File>;

  /**
   * Set to `true` to allow multiple files
   * @default false
   */
  multiple?: boolean;

  /**
   * Set to `true` to disable the input
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to disable label changes
   * @default false
   */
  disableLabelChanges?: boolean;

  /**
   * Specify the kind of file uploader button
   * @default "primary"
   */
  kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";

  /**
   * Specify the label text
   * @default "Add file"
   */
  labelText?: string;

  /**
   * Specify the label role
   * @default "button"
   */
  role?: string;

  /**
   * Specify `tabindex` attribute
   * @default "0"
   */
  tabindex?: string;

  /**
   * Set an id for the input element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify a name attribute for the input
   * @default ""
   */
  name?: string;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;
}

export default class FileUploaderButton extends SvelteComponentTyped<
  FileUploaderButtonProps,
  {
    change: CustomEvent<ReadonlyArray<File>>;
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
  },
  { labelText: {} }
> {}
