/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface FilenameProps {
  /**
   * Specify the file name status
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
}

export default class Filename extends SvelteComponentTyped<
  FilenameProps,
  { click: WindowEventMap["click"]; keydown: WindowEventMap["keydown"] },
  {}
> {}
