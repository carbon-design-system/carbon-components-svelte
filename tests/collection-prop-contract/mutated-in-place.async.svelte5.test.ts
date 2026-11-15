import CollectionHost from "./fixtures/CollectionHost.async.svelte5.test.svelte";
import { describeMutatedInPlace } from "./suite";

// Svelte 5 only: the runes host, compiled with `experimental.async` (see
// vite.config.ts), so every component in the contract runs in async mode.
describeMutatedInPlace("async", CollectionHost);
