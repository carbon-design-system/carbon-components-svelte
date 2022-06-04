/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface FileUploaderProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the file uploader status
   * @default "uploading"
   */
  status?: "uploading" | "edit" | "complete";

  /**
   * Set to `true` to disable the file uploader
   * @default false
   */
  disabled?: boolean;

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
   * Specify the label description
   * @default ""
   */
  labelDescription?: string;

  /**
   * Specify the label title
   * @default ""
   */
  labelTitle?: string;

  /**
   * Specify the kind of file uploader button
   * @default "primary"
   */
  kind?: "primary" | "secondary" | "tertiary" | "ghost" | "danger";

  /**
   * Specify the button label
   * @default ""
   */
  buttonLabel?: string;

  /**
   * Specify the ARIA label used for the status icons
   * @default "Provide icon description"
   */
  iconDescription?: string;

  /**
   * Specify a name attribute for the file button uploader input
   * @default ""
   */
  name?: string;
}

export default class FileUploader extends SvelteComponentTyped<
  FileUploaderProps,
  {
    add: CustomEvent<ReadonlyArray<File>>;
    remove: CustomEvent<ReadonlyArray<File>>;
    change: CustomEvent<ReadonlyArray<File>>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  {}
> {
  /**
   * Programmatically clear the uploaded files
   */
  clearFiles: () => void;
}
