import type { Readable } from "svelte/store";
import type { UnsavedChangesStore } from "../UnsavedChanges/unsaved-changes.js";

export interface StepDefinition {
  /** Identifies the step. Unique in the flow. */
  id: string;
  /** The step's name, in the rail and its heading. */
  label: string;
  /** Text under the label in the rail. Optional steps default to `optionalText`. */
  secondaryLabel?: string;
  /** The user can go on without filling in the step. */
  optional?: boolean;
  /** The step can't be entered. */
  disabled?: boolean;
  /**
   * An earlier answer skipped the step. A skipped step leaves the rail, and
   * the step count (`Step 2 of 3`) leaves it out.
   */
  skipped?: boolean;
}

export interface StepInfo {
  id: string;
  label: string;
  secondaryLabel: string | undefined;
  optional: boolean;
  disabled: boolean;
  /** The step's last validation failed, or the owner marked it. */
  invalid: boolean;
  /** The step passed validation. Every step is complete once submitted. */
  complete: boolean;
  /** The step the user is on. No step is current once submitted. */
  current: boolean;
  /** The user has been on the step. */
  visited: boolean;
  /** `goTo()` can enter the step. */
  reachable: boolean;
  /** Position among the steps that are not skipped, from 0. */
  index: number;
  /** `index + 1`. */
  number: number;
  /** How many steps are not skipped. */
  total: number;
}

export type StepFlowStatus =
  "idle" | "validating" | "submitting" | "submitted" | "failed";

export interface StepFlowState {
  id: string;
  /** The steps that are not skipped, in order. */
  steps: StepInfo[];
  current: StepInfo;
  index: number;
  total: number;
  first: boolean;
  last: boolean;
  status: StepFlowStatus;
  /** A validation or the submit is running. */
  busy: boolean;
  submitted: boolean;
  /** What the last validation or submit threw, until the next attempt. */
  error: unknown;
}

export interface StepFlowOptions {
  /** Prefix for the ids the flow's components generate. */
  id?: string;
  steps?: StepDefinition[];
  /** The id of the step to start on. */
  initial?: string;
  /**
   * `true` (default): a step can be entered once every step before it is
   * complete. `false`: any step that is not disabled can be entered.
   */
  linear?: boolean;
  /** The secondary label of an optional step. */
  optionalText?: string;
  /**
   * Runs when `next()` leaves a step, and for every step not yet complete on
   * submit. Return `false` (or a promise of `false`) to stay and mark the
   * step invalid. Throw, or reject, for a failure that is not the user's
   * input; it lands in `error`.
   */
  validate?: (
    step: StepInfo,
  ) => boolean | undefined | Promise<boolean | undefined>;
  /**
   * Runs when `next()` is called on the last step and every step is valid.
   * Throw, or reject, to fail the submission.
   */
  submit?: (state: StepFlowState) => unknown;
  /** Call `markSaved()` on this store when the submit succeeds. */
  unsavedChanges?: UnsavedChangesStore;
}

export interface StepFlowFocusRequest {
  /** Where focus should go; `null` before the first request. */
  target: "step" | "invalid" | "error" | "submitted" | null;
  /** Increases with every request, so two in a row are told apart. */
  count: number;
}

export interface StepFlow extends Readable<StepFlowState> {
  id: string;
  /** Requests for focus after a step change, a failed check or the submit. */
  focus: Readable<StepFlowFocusRequest>;
  /**
   * Validate the current step and go to the next one; on the last step,
   * validate any step not yet complete and submit. Resolves `true` when it
   * moved on or submitted.
   */
  next: () => Promise<boolean>;
  /** Go to the previous step, with no validation. */
  back: () => boolean;
  /** Go to a step the flow can enter: a completed one, or any in a non-linear flow. */
  goTo: (id: string) => boolean;
  /**
   * Change a step. `skipped` hides it, `invalid` and `complete` set its
   * state. Call it from `$:` to react to an earlier answer.
   */
  update: (
    id: string,
    patch: Partial<StepDefinition> & { invalid?: boolean; complete?: boolean },
  ) => void;
  /** Replace the step list. State is kept for ids that stay. */
  setSteps: (steps: StepDefinition[]) => void;
  /** Back to the first step, with no step complete. Starts no focus request. */
  reset: () => void;
  /** Clear `error`. */
  clearError: () => void;
}

/** Create the state of a multi-step create flow. */
export function createStepFlow(options?: StepFlowOptions): StepFlow;

/** `Step 2 of 4`. */
export function defaultStepText(info: {
  number: number;
  total: number;
}): string;
