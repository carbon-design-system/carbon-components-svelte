import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface FileUploaderDropContainerProps extends RestProps {
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
   * Override the default behavior of validating uploaded files.
   * By default, files are not validated
   * @default (files) => files
   */
  validateFiles?: (files: ReadonlyArray<File>) => ReadonlyArray<File>;

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

  [key: `data-${string}`]: any;
}

export default class FileUploaderDropContainer extends SvelteComponentTyped<
  FileUploaderDropContainerProps,
  {
    add: CustomEvent<ReadonlyArray<File>>;
    change: CustomEvent<ReadonlyArray<File>>;
    dragover: WindowEventMap["dragover"];
    dragleave: WindowEventMap["dragleave"];
    drop: WindowEventMap["drop"];
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
  },
  { labelText: {} }
> {}
