import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["input"];

type $Props = {
  /**
   * Specify the accepted file types.
   * @default []
   */
  accept?: ReadonlyArray<string>;

  /**
   * Obtain a reference to the uploaded files.
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
   * Specify the kind of file uploader button.
   * @default "primary"
   */
  kind?: import("../Button/Button.svelte").ButtonProps["kind"];

  /**
   * Specify the size of the file uploader button.
   * @default "small"
   */
  size?: import("../Button/Button.svelte").ButtonProps["size"];

  /**
   * Specify the label text
   * @default "Add file"
   */
  labelText?: string;

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
};

export type FileUploaderButtonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class FileUploaderButton extends SvelteComponentTyped<
  FileUploaderButtonProps,
  {
    change: CustomEvent<ReadonlyArray<File>>;
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
  },
  { labelText: Record<string, never> }
> {}
