export interface SuggestContext {
  signal: AbortSignal;
}
export type SuggestFunction = (
  value: string,
  context: SuggestContext,
) => string | null | undefined | Promise<string | null | undefined>;
export function createSuggestSource(
  onResult: (suggestion: string, value: string) => void,
): {
  ask: (load: SuggestFunction, value: string, delay?: number) => void;
  cancel: () => void;
  isPending: () => boolean;
};
