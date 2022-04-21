/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface EditorProps {
  /**
   * Set to `true` to disable the dropdown
   * @default false
   */
  disabled?: boolean;

  /**
   * Specify the title text
   * @default ""
   */
  titleText?: string;

  /**
   * Set to `true` to indicate an invalid state
   * @default false
   */
  invalid?: boolean;

  /**
   * Specify the invalid state text
   * @default ""
   */
  invalidText?: string;

  /**
   * Set to `true` to indicate an warning state
   * @default false
   */
  warn?: boolean;

  /**
   * Specify the warning state text
   * @default ""
   */
  warnText?: string;

  /**
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Set an id for the list box component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;

  /**
   * Specify the placeholder text
   * @default null
   */
  placeholder?: undefined;

  /**
   * Specify the html
   * @default undefined
   */
  html?: string;

  /**
   * Specify the text
   * @default undefined
   */
  text?: string;

  /**
   * @default { modules: { toolbar }, theme: 'snow', placeholder }
   */
  options?: { modules: { toolbar }; theme: "snow"; placeholder };
}

export default class Editor extends SvelteComponentTyped<EditorProps, {}, {}> {}
