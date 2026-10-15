import type { RenderResult } from "@testing-library/svelte";

/**
 * The consumer naming and description attributes. Each must land on the
 * element that takes focus or carries the role, never on a wrapper.
 */
export type AriaAttribute =
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby";

export const CONSUMER_LABEL = "Contract label";
export const CONSUMER_LABEL_ID = "contract-label";
export const CONSUMER_DESCRIPTION_ID = "contract-description";

// biome-ignore lint/suspicious/noExplicitAny: cases render many component types
type Rendered = RenderResult<any, any>;

export type AriaCase = {
  /** Component name, as exported from the package. */
  name: string;
  /** Tells cases apart when a component has more than one. */
  variant?: string;
  /** Render with the consumer attributes passed as rest props. */
  render: (attrs: Partial<Record<AriaAttribute, string>>) => Rendered;
  /** The element that takes focus or carries the role. */
  target: (result: Rendered) => HTMLElement;
  /** Attributes this case doesn't check, each with the reason. */
  skip?: Partial<Record<AriaAttribute, string>>;
};

/** A component that takes no part in the contract, with the reason. */
export type AriaExempt = { name: string; exempt: string };

export type AriaEntry = AriaCase | AriaExempt;

export const isExempt = (entry: AriaEntry): entry is AriaExempt =>
  "exempt" in entry;
