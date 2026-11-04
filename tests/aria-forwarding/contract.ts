import type { RenderResult } from "@testing-library/svelte";

/**
 * The consumer naming and description attributes. Each must land on the
 * element that takes focus or carries the role, never on a wrapper.
 */
export type AriaAttribute =
  "aria-label" | "aria-labelledby" | "aria-describedby";

/**
 * Other `aria-*` attributes a case can opt into with `also`. A dialog's role
 * description belongs on the dialog, not the presentation wrapper around it.
 */
export type AriaExtraAttribute = "aria-roledescription";

export const CONSUMER_ROLE_DESCRIPTION = "gallery";
export const CONSUMER_LABEL = "Contract label";
export const CONSUMER_LABEL_ID = "contract-label";
export const CONSUMER_DESCRIPTION_ID = "contract-description";

// `RenderResult<any>` pins the default queries; `render` returns generic ones.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cases render many component types
type Rendered = RenderResult<any, any>;

export type AriaCase = {
  /** Component name, as exported from the package. */
  name: string;
  /** Tells cases apart when a component has more than one. */
  variant?: string;
  /** Render with the consumer attributes passed as rest props. */
  render: (
    attrs: Partial<Record<AriaAttribute | AriaExtraAttribute, string>>,
  ) => Rendered;
  /**
   * The element that takes focus or carries the role. Return several when
   * the component shares its naming across controls, like a slider's thumb
   * and text input.
   */
  target: (result: Rendered) => HTMLElement | HTMLElement[];
  /** Attributes this case doesn't check, each with the reason. */
  skip?: Partial<Record<AriaAttribute, string>>;
  /** Further attributes this case checks land on the target. */
  also?: AriaExtraAttribute[];
};

/** A component that takes no part in the contract, with the reason. */
export type AriaExempt = { name: string; exempt: string };

export type AriaEntry = AriaCase | AriaExempt;

export const isExempt = (entry: AriaEntry): entry is AriaExempt =>
  "exempt" in entry;
