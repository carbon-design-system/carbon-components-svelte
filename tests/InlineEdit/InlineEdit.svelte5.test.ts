// Svelte 5 only: Svelte 3 and 4 reject `bind:` on a `let:` slot prop, the
// pattern the DataTable cell example uses.
import { describeBindValueInRow } from "./bind-value-suite";
import InlineEditDataTableCell from "./InlineEditDataTableCell.svelte5.test.svelte";

describeBindValueInRow("a DataTable cell slot", InlineEditDataTableCell);
