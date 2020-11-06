/// <reference types="svelte" />

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

export default class Filename {
  $$prop_def: FilenameProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
