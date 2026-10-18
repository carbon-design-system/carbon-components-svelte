export type StepState = {
  /** Step ids in display order */
  ids: ReadonlyArray<string>;
  /** -1 when `ids` is empty */
  currentIndex: number;
  completed: ReadonlySet<string>;
  invalid: ReadonlySet<string>;
  disabled: ReadonlySet<string>;
};

export type StepFlags = {
  /** -1 when the id is unknown */
  index: number;
  current: boolean;
  complete: boolean;
  invalid: boolean;
  disabled: boolean;
};

export function createStepState(
  ids?: ReadonlyArray<string>,
  currentIndex?: number,
): StepState;

export function setStepIds(
  state: StepState,
  ids: ReadonlyArray<string>,
): StepState;

export function goToStep(state: StepState, index: number): StepState;

export function nextStep(state: StepState): StepState;

export function previousStep(state: StepState): StepState;

export function isFirstStep(state: StepState): boolean;

export function isLastStep(state: StepState): boolean;

export function setStepComplete(
  state: StepState,
  id: string,
  complete?: boolean,
): StepState;

export function setStepInvalid(
  state: StepState,
  id: string,
  invalid?: boolean,
): StepState;

export function setStepDisabled(
  state: StepState,
  id: string,
  disabled?: boolean,
): StepState;

export function getStepFlags(state: StepState, id: string): StepFlags;
