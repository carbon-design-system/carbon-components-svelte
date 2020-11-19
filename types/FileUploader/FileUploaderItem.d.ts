/// <reference types="svelte" />

export interface FileUploaderItemProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["span"]> {
  /**
   * Specify the file uploader status
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

  /**
   * Specify the error subject text
   * @default ""
   */
  errorSubject?: string;

  /**
   * Specify the error body text
   * @default ""
   */
  errorBody?: string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify the file uploader name
   * @default ""
   */
  name?: string;
}

export default class FileUploaderItem {
  $$prop_def: FileUploaderItemProps;
  $$slot_def: {};

  $on(eventname: "delete", cb: (event: CustomEvent<string>) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
