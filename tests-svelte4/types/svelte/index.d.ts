// svelte2tsx prefixes each component with `/// <reference types="svelte" />`.
// `paths` doesn't apply to type references, so without this root the
// reference resolves from tests/ to the root Svelte 5 install.
/// <reference path="../../node_modules/svelte/types/index.d.ts" />
