import type { ComponentType } from "svelte";

/** Fluid behaviors a case can skip, each with the reason. */
export type FluidBehavior = "hidesHelper" | "messagesInWrapper";

export type FieldCase = {
  /** Component name, as exported from the package. */
  name: string;
  /** Tells cases apart when a component has more than one. */
  variant?: string;
  component: ComponentType;
  /** Props every render of this case starts from. */
  props?: Record<string, unknown>;
  /**
   * The element that takes focus and carries `aria-invalid`. Return several
   * when the field has more than one, like PinCodeInput's segments. The
   * label is always the text "Field", passed through `labelChildren`.
   */
  control: () => HTMLElement | HTMLElement[];
  fluid?: {
    /** Class the fluid variant adds. */
    className: string;
    /** Element that holds the invalid and warning messages when fluid. */
    wrapper: string;
    /**
     * Attribute that points the control at the invalid message. Defaults to
     * `aria-errormessage`.
     */
    errorAttribute?: "aria-errormessage" | "aria-describedby";
    /** Props that turn the fluid variant off even with `fluid` set. */
    ignoredWith?: Record<string, unknown>;
    skip?: Partial<Record<FluidBehavior, string>>;
  };
  /** Takes part in the invalid, warning, and helper text contract. */
  state?: {
    /**
     * Attribute that points the control at the invalid message. Defaults to
     * `aria-errormessage`.
     */
    errorAttribute?: "aria-errormessage" | "aria-describedby";
    /**
     * Element that `aria-describedby` points at the helper and warning text.
     * Defaults to the controls.
     */
    described?: () => HTMLElement;
  };
  /** Takes part in the form reset contract. */
  reset?: {
    /** Value to render with, or to restore as the server-rendered default. */
    initial: string;
    /** Keys the user types after clicking the first control. */
    typed: string;
    /**
     * Set to `false` when the typed text isn't the submitted value, like a
     * filter input, so the reset test skips the `FormData` check.
     */
    submits?: boolean;
    /** Events the field dispatches while the user types and leaves it. */
    events: ("input" | "change")[];
    /**
     * Mimics server-rendered markup, which carries the value as the
     * controls' `value` attribute. Defaults to setting the first control's
     * `defaultValue`.
     */
    serverDefault?: (value: string) => void;
  };
  /** Value to render with, for the `selectTextOnFocus` contract. */
  selectOnFocus?: { value: string | number };
  fluidSkeleton?: {
    component: ComponentType;
    /** Class on the skeleton root. */
    className: string;
    /** Class on the field placeholder that follows the label placeholder. */
    field: string;
  };
};

/**
 * Components that have a prop or skeleton a contract checks but take no
 * part in it, with the reason. Keyed by contract, then component name.
 */
export type Exemptions = Record<
  "fluid" | "state" | "reset" | "selectOnFocus" | "fluidSkeleton",
  Record<string, string>
>;

export const controls = (c: FieldCase) => [c.control()].flat();

export const title = (c: FieldCase) =>
  c.variant ? `${c.name} (${c.variant})` : c.name;
