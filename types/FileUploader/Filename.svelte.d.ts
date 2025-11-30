import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"] &
  SvelteHTMLElements["button"] &
  SvelteHTMLElements["svg"];

type $Props = {
  /**
   * Specify the file name status.
   * @default "uploading"
   */
  status?: "uploading" | "edit" | "complete";

  /**
   * Specify the ARIA label used for the status icons
   * @default ""
   */
  iconDescription?: string;

  /**
   * Set to `true` to indicate an invalid state
   * @default false
   */
  invalid?: boolean;

  [key: `data-${string}`]: any;
};

export type FilenameProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Filename extends SvelteComponentTyped<
  FilenameProps,
  { click: WindowEventMap["click"]; keydown: WindowEventMap["keydown"] },
  Record<string, never>
> {}
