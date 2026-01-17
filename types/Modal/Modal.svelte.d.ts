import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Set the size of the modal.
   * @default undefined
   */
  size?: "xs" | "sm" | "lg";

  /**
   * Set to `true` to open the modal
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to use the danger variant
   * @default false
   */
  danger?: boolean;

  /**
   * Set to `true` to enable alert mode
   * @default false
   */
  alert?: boolean;

  /**
   * Set to `true` to use the passive variant
   * @default false
   */
  passiveModal?: boolean;

  /**
   * Specify the modal heading.
   * @default undefined
   */
  modalHeading?: string;

  /**
   * Specify the modal label.
   * @default undefined
   */
  modalLabel?: string;

  /**
   * Specify the ARIA label for the modal.
   * @default undefined
   */
  modalAriaLabel?: string;

  /**
   * Specify the ARIA label for the close icon
   * @default "Close the modal"
   */
  iconDescription?: string;

  /**
   * Set to `true` if the modal contains form elements
   * @default false
   */
  hasForm?: boolean;

  /**
   * Specify the ID of a form element to associate with the primary button.
   * This enables the primary button to submit the form from outside the form element.
   * @default undefined
   */
  formId?: string;

  /**
   * Set to `true` if the modal contains scrolling content
   * @default false
   */
  hasScrollingContent?: boolean;

  /**
   * Specify the primary button text
   * @default ""
   */
  primaryButtonText?: string;

  /**
   * Set to `true` to disable the primary button
   * @default false
   */
  primaryButtonDisabled?: boolean;

  /**
   * Specify the primary button icon.
   * @default undefined
   */
  primaryButtonIcon?: any;

  /**
   * Set to `true` for the "submit" and "click:button--primary" events
   * to be dispatched when pressing "Enter".
   * @default true
   */
  shouldSubmitOnEnter?: boolean;

  /**
   * Specify the secondary button text
   * @default ""
   */
  secondaryButtonText?: string;

  /**
   * 2-tuple prop to render two secondary buttons for a 3 button modal.
   * Supersedes `secondaryButtonText`.
   * @default []
   */
  secondaryButtons?: [{ text: string }, { text: string }];

  /**
   * Specify a selector to be focused when opening the modal
   * @default "[data-modal-primary-focus]"
   */
  selectorPrimaryFocus?: string;

  /**
   * Set to `true` to prevent the modal from closing when clicking outside
   * @default false
   */
  preventCloseOnClickOutside?: boolean;

  /**
   * Set an id for the top-level element
   * @default `ccs-${Math.random().toString(36)}`
   */
  id?: string;

  /**
   * Obtain a reference to the top-level HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;

  heading?: () => void;

  label?: () => void;

  [key: `data-${string}`]: any;
};

export type ModalProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Modal extends SvelteComponentTyped<
  ModalProps,
  {
    close: CustomEvent<{
      trigger: "escape-key" | "outside-click" | "close-button";
    }>;
    transitionend: CustomEvent<{ open: boolean }>;
    "click:button--secondary": CustomEvent<{ text: string }>;
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    submit: CustomEvent<null>;
    "click:button--primary": CustomEvent<null>;
    open: CustomEvent<null>;
  },
  {
    heading: Record<string, never>;
    label: Record<string, never>;
    default: Record<string, never>;
  }
> {}
