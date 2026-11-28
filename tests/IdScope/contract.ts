/**
 * Ids that a component derives from its `id` and documents on that prop, as
 * `Contract.test.svelte` renders it with `id="fixed"`. Consumers point labels,
 * `aria-controls` and `returnFocusTo` at them, so renaming one breaks them.
 * Entries named after a family in `families.ts` render its family fixture.
 */
export const DERIVED_IDS = {
  DataTable: ["fixed-title", "fixed-name", "fixed-r1"],
  DataTableBatchExpandable: [
    "fixed-description",
    "fixed-select-all",
    "fixed-expand",
    "fixed-expandable-row-r1",
  ],
  NumberRangeInput: ["fixed-min", "fixed-max"],
  Tooltip: ["fixed-trigger", "fixed-tooltip"],
  CodeSnippet: ["fixed-title"],
  CodeSnippetFiles: ["fixed-tab-0", "fixed-tab-1"],
  ExpandableTile: ["fixed-content"],
  HeaderAction: ["fixed-panel"],
  PinCodeInput: ["fixed", "fixed-1", "fixed-2", "fixed-3"],
  Coachmark: ["fixed-target", "fixed-content", "fixed-title"],
} as const satisfies Record<string, readonly string[]>;
