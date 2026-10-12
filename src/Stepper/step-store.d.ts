import type { StepFlags, StepState } from "../utils/step-state";

export type { StepFlags, StepState };

export type StepStoreOptions = {
  ids?: ReadonlyArray<string>;
  currentIndex?: number;
};

export type StepStore = {
  subscribe: (run: (value: StepState) => void) => () => void;
  setIds: (ids: ReadonlyArray<string>) => void;
  /** true when the index changed */
  goTo: (index: number) => boolean;
  next: () => boolean;
  back: () => boolean;
  setComplete: (id: string, complete?: boolean) => void;
  setInvalid: (id: string, invalid?: boolean) => void;
  setDisabled: (id: string, disabled?: boolean) => void;
  /** read once, not reactive */
  flags: (id: string) => StepFlags;
  /** back to the initial options */
  reset: () => void;
};

/**
 * Headless step navigation store for building custom wizard layouts without
 * the `Stepper` component.
 */
export function createStepStore(options?: StepStoreOptions): StepStore;
