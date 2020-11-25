/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export type Files = string[];

export interface FileUploaderDropContainerProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the accepted file types
   * @default []
   */
  accept?: Files;

  /**
   * Set to `true` to allow multiple files
   * @default false
   */
  multiple?: boolean;

  /**
   * Override the default behavior of validating uploaded files
   * The default behavior does not validate files
   * @default (files) => files
   */
  validateFiles?: (files: Files) => Files;

  /**
   * Specify the label text
   * @default "Add file"
   */
  labelText?: string;

  /**
   * Specify the `role` attribute of the drop container
   * @default "button"
   */
  role?: string;

  /**
   * Set to `true` to disable the input
   * @default false
   */
  disabled?: boolean;

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

export default class FileUploaderDropContainer extends SvelteComponent<
  FileUploaderDropContainerProps,
  {
    add: CustomEvent<Files>;
    dragover: WindowEventMap["dragover"];
    dragleave: WindowEventMap["dragleave"];
    drop: WindowEventMap["drop"];
    keydown: WindowEventMap["keydown"];
    change: WindowEventMap["change"];
    click: WindowEventMap["click"];
  },
  {}
> {}
