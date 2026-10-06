// @ts-check

// Context keys read by components outside the family that sets them, for
// consumers and tests that provide or read the same context. Components
// write the string literal at each `getContext`/`setContext` call instead of
// importing these, so `carbon-preprocess-svelte` can resolve the key and
// drop branches guarded by a context that is never provided.

/** Set by `FluidForm`; read by form fields to opt into fluid styles. */
export const FORM_CONTEXT_KEY = "carbon:Form";

/** Set by `Modal` and `ComposedModal`; read by overlays inside them. */
export const MODAL_CONTEXT_KEY = "carbon:Modal";

/**
 * Set by `ProfileMenu` and `HeaderSwitcher`; read by `ProfileMenuItem`
 * so items register with either parent.
 */
export const PROFILE_MENU_CONTEXT_KEY = "carbon:ProfileMenu";
