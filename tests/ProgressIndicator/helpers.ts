export type StepConfig = {
  label: string;
  description: string;
  complete: boolean;
  invalid?: boolean;
  disabled?: boolean;
};

const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth"];

/** Builds `Step N` fixture steps from per-step `complete` flags, with optional per-index overrides. */
export function makeSteps(
  complete: boolean[],
  overrides: Record<number, Partial<StepConfig>> = {},
): StepConfig[] {
  return complete.map((isComplete, i) => ({
    label: `Step ${i + 1}`,
    description: `${ORDINALS[i]} step`,
    complete: isComplete,
    ...overrides[i],
  }));
}
