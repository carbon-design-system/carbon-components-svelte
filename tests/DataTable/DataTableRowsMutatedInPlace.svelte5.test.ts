import DataTableRowsMutatedInPlace from "./DataTableRowsMutatedInPlace.svelte5.test.svelte";
// Svelte 5 only: a runes `$state` array mutated in place, never reassigned.
import { describeRowsMutatedInPlace } from "./rows-mutated-in-place-suite";

describeRowsMutatedInPlace("a $state array", DataTableRowsMutatedInPlace);
