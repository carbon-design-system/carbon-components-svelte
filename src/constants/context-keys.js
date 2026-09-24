// @ts-check

// Context keys read by components outside the family that sets them.
// Family-local keys (e.g. "carbon:Tabs") stay inline next to their use.

/** Set by `FluidForm`; read by form fields to opt into fluid styles. */
export const FORM_CONTEXT_KEY = "carbon:Form";

/** Set by `Modal` and `ComposedModal`; read by overlays inside them. */
export const MODAL_CONTEXT_KEY = "carbon:Modal";

/**
 * Set by `ProfileMenu` and `HeaderSwitcher`; read by `ProfileMenuItem`
 * so items register with either parent.
 */
export const PROFILE_MENU_CONTEXT_KEY = "carbon:ProfileMenu";
