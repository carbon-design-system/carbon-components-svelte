/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface CodeSnippetProps {
  /**
   * Set the type of code snippet
   * @default "single"
   */
  type?: "single" | "inline" | "multi";

  /**
   * Set the code snippet text
   * Alternatively, use the default slot (e.g., <CodeSnippet>{`code`}</CodeSnippet>)
   * You must use the `code` prop to copy the code
   * @default undefined
   */
  code?: string;

  /**
   * Override the default copy behavior of using the navigator.clipboard.writeText API to copy text
   * @default async (code) => { try { await navigator.clipboard.writeText(code); } catch (e) { console.log(e); } }
   */
  copy?: (code: string) => void;

  /**
   * Set to `true` to expand a multi-line code snippet (type="multi")
   * @default false
   */
  expanded?: boolean;

  /**
   * Set to `true` to hide the copy button
   * @default false
   */
  hideCopyButton?: boolean;

  /**
   * Set to `true` for the disabled variant
   * Only applies to the "single", "multi" types
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to wrap the text
   * Note that `type` must be "multi"
   * @default false
   */
  wrapText?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;

  /**
   * Specify the ARIA label for the copy button icon
   * @default undefined
   */
  copyButtonDescription?: string;

  /**
   * Specify the ARIA label of the copy button
   * @default undefined
   */
  copyLabel?: string;

  /**
   * Specify the feedback text displayed when clicking the snippet
   * @default "Copied!"
   */
  feedback?: string;

  /**
   * Set the timeout duration (ms) to display feedback text
   * @default 2000
   */
  feedbackTimeout?: number;

  /**
   * Specify the show less text
   * `type` must be "multi"
   * @default "Show less"
   */
  showLessText?: string;

  /**
   * Specify the show more text
   * `type` must be "multi"
   * @default "Show more"
   */
  showMoreText?: string;

  /**
   * Set to `true` to enable the show more/less button
   * @default false
   */
  showMoreLess?: boolean;

  /**
   * Set an id for the code element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Obtain a reference to the pre HTML element
   * @default null
   */
  ref?: null | HTMLPreElement;
}

export default class CodeSnippet extends SvelteComponentTyped<
  CodeSnippetProps,
  {
    expand: CustomEvent<null>;
    collapse: CustomEvent<null>;
    copy: CustomEvent<null>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    animationend: WindowEventMap["animationend"];
  },
  { default: {} }
> {}
