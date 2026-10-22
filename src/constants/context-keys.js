// @ts-check

// Context keys read by components outside the family that sets them, for
// consumers and tests that provide or read the same context. Components
// write the string literal at each `getContext`/`setContext` call instead of
// importing these, so `carbon-preprocess-svelte` can resolve the key and
// drop branches guarded by a context that is never provided.

/** Set by `FluidForm`; read by form fields to opt into fluid styles. */
export const FORM_CONTEXT_KEY = "carbon:Form";

/**
 * Set by `Form`; read by form fields and their skeletons to inherit `size`
 * when their own `size` is unset.
 */
export const FORM_SIZE_CONTEXT_KEY = "carbon:FormSize";

/**
 * Set by `FormItem` and `FormGroup`; read by `FormLabel`,
 * `FormHelperText`, and `FormRequirement` to derive ids from the item's
 * control or the group's fieldset.
 */
export const FORM_ITEM_CONTEXT_KEY = "carbon:FormItem";

/** Set by `Modal` and `ComposedModal`; read by overlays inside them. */
export const MODAL_CONTEXT_KEY = "carbon:Modal";

/**
 * Set by `ProfileMenu` and `HeaderSwitcher`; read by `ProfileMenuItem`
 * so items register with either parent.
 */
export const PROFILE_MENU_CONTEXT_KEY = "carbon:ProfileMenu";

/**
 * Set by fields that render a `decorator` slot; read by `AILabel` to size
 * itself for the field and report its state back.
 */
export const AI_LABEL_HOST_CONTEXT_KEY = "carbon:AILabelHost";
