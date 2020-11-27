/// <reference types="svelte" />

export interface CodeSnippetProps {
  /**
   * Set the type of code snippet
   * @default "single"
   */
  type?: "single" | "inline" | "multi";

  /**
   * Set the code snippet text
   * Alternatively, use the default slot (e.g., <CodeSnippet>{`code`}</CodeSnippet>)
   */
  code?: string;

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
   */
  copyButtonDescription?: string;

  /**
   * Specify the ARIA label of the copy button
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

export default class CodeSnippet {
  $$prop_def: CodeSnippetProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "animationend", cb: (event: WindowEventMap["animationend"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
