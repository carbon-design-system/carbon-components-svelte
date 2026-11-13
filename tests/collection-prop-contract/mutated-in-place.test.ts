import CollectionHost from "./fixtures/CollectionHost.test.svelte";
import { describeMutatedInPlace } from "./suite";

// `items.splice(...); items = items`, the Svelte 3 and 4 idiom.
describeMutatedInPlace("legacy", CollectionHost);
