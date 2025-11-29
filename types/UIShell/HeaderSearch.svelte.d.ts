import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type HeaderSearchResult = {
  href: string;
  text: string;
  description?: string;
};

type $RestProps = SvelteHTMLElements["input"];

type $Props<Result> = {
  /**
   * Specify the search input value
   * @default ""
   */
  value?: string;

  /**
   * Set to `true` to activate and focus the search bar
   * @default false
   */
  active?: boolean;

  /**
   * Obtain a reference to the input HTML element
   * @default null
   */
  ref?: null | HTMLInputElement;

  /**
   * Render a list of search results
   * @default []
   */
  results?: ReadonlyArray<Result>;

  /**
   * Specify the selected result index
   * @default 0
   */
  selectedResultIndex?: number;

  [key: `data-${string}`]: any;
};

export type HeaderSearchProps<Result> = Omit<$RestProps, keyof $Props<Result>> &
  $Props<Result>;

export default class HeaderSearch<
  Result extends HeaderSearchResult = HeaderSearchResult,
> extends SvelteComponentTyped<
  HeaderSearchProps<Result>,
  {
    active: CustomEvent<null>;
    inactive: CustomEvent<null>;
    clear: CustomEvent<null>;
    select: CustomEvent<{
      value: string;
      selectedResultIndex: number;
      selectedResult: Result;
    }>;
    change: WindowEventMap["change"];
    input: WindowEventMap["input"];
    focus: WindowEventMap["focus"];
    blur: WindowEventMap["blur"];
    keydown: WindowEventMap["keydown"];
    paste: WindowEventMap["paste"];
  },
  { default: { result: Result; index: number } }
> {}
