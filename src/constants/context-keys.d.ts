/** Set by `FluidForm`; read by form fields to opt into fluid styles. */
export const FORM_CONTEXT_KEY: "carbon:Form";

/**
 * Set by `FormItem`; read by `FormLabel`, `FormHelperText`, and
 * `FormRequirement` to derive ids from the item's control.
 */
export const FORM_ITEM_CONTEXT_KEY: "carbon:FormItem";

/** Set by `Modal` and `ComposedModal`; read by overlays inside them. */
export const MODAL_CONTEXT_KEY: "carbon:Modal";

/**
 * Set by `ProfileMenu` and `HeaderSwitcher`; read by `ProfileMenuItem`
 * so items register with either parent.
 */
export const PROFILE_MENU_CONTEXT_KEY: "carbon:ProfileMenu";

/**
 * Set by `Form`; read by form fields and their skeletons to inherit `size`
 * when their own `size` is unset.
 */
export const FORM_SIZE_CONTEXT_KEY: "carbon:FormSize";
