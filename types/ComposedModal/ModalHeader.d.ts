/// <reference types="svelte" />

export interface ModalHeaderProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the modal title
   * @default ""
   */
  title?: string;

  /**
   * Specify the modal label
   * @default ""
   */
  label?: string;

  /**
   * Specify the label class
   * @default ""
   */
  labelClass?: string;

  /**
   * Specify the title class
   * @default ""
   */
  titleClass?: string;

  /**
   * Specify the close class
   * @default ""
   */
  closeClass?: string;

  /**
   * Specify the close icon class
   * @default ""
   */
  closeIconClass?: string;

  /**
   * Specify the ARIA label for the close icon
   * @default "Close"
   */
  iconDescription?: string;
}

export default class ModalHeader {
  $$prop_def: ModalHeaderProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
