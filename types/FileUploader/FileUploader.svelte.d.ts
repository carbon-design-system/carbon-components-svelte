import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the file uploader status.
   * @default "uploading"
   */
  status?: "uploading" | "edit" | "complete";

  /**
   * Set to `true` to disable the file uploader
   * @default false
   */
  disabled?: boolean;

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
   * Specify the label title.
   * Alternatively, use the named slot "labelTitle".
   * @example
   * ```svelte
   * <FileUploader>
   *   <span slot="labelTitle">Custom Label</span>
   * </FileUploader>
   * ```
   * @default ""
   */
  labelTitle?: string;

  /**
   * Specify the label description.
   * Alternatively, use the named slot "labelDescription".
   * @example
   * ```svelte
   * <FileUploader>
   *   <span slot="labelDescription">Custom description text</span>
   * </FileUploader>
   * ```
   * @default ""
   */
  labelDescription?: string;

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

  [key: `data-${string}`]: any;
};

export type FileUploaderProps = Omit<$RestProps, keyof $Props> & $Props;

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
  { labelDescription: Record<string, never>; labelTitle: Record<string, never> }
> {
  /**
   * Programmatically clear the uploaded files.
   * @example
   * ```svelte
   * <FileUploader bind:this={uploader} bind:files={files} />
   * <button on:click={() => uploader.clearFiles()}>Clear Files</button>
   * ```
   */
  clearFiles: () => void;
}
