import CollectionHost from "./fixtures/CollectionHost.svelte5.test.svelte";
import { describeMutatedInPlace } from "./suite";

// Svelte 5 only: a runes `$state` array spliced without reassignment.
describeMutatedInPlace("runes", CollectionHost);
