/** Set by `FluidForm`; read by form fields to opt into fluid styles. */
export const FORM_CONTEXT_KEY: "carbon:Form";

/**
 * Set by `FormItem` and `FormGroup`; read by `FormLabel`,
 * `FormHelperText`, and `FormRequirement` to derive ids from the item's
 * control or the group's fieldset.
 */
export const FORM_ITEM_CONTEXT_KEY: "carbon:FormItem";

/** Set by `Modal` and `ComposedModal`; read by overlays inside them. */
export const MODAL_CONTEXT_KEY: "carbon:Modal";

/**
 * Set by `Layer`, and by `Modal`, `ComposedModal`, and `ModalBody`, which
 * start their own layers; read by `Layer`. Holds a readable store of the
 * level a child `Layer` sits at.
 */
export const LAYER_CONTEXT_KEY: "carbon:Layer";

/**
 * Set by `LayoutDirection` to a readable store of its `dir`; read through
 * `getLayoutDirection` by components that need the writing direction,
 * and by portals so content they move out of the subtree keeps it.
 */
export const LAYOUT_DIRECTION_CONTEXT_KEY: "carbon:LayoutDirection";

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

/**
 * Set by fields that render a `decorator` slot; read by `AILabel` to size
 * itself for the field and report its state back.
 */
export const AI_LABEL_HOST_CONTEXT_KEY: "carbon:AILabelHost";

/**
 * Set by `ThemeZone` to a readable store of its theme; read by portals so
 * content they move out of the zone keeps its theme.
 */
export const THEME_ZONE_CONTEXT_KEY: "carbon:ThemeZone";

/**
 * Set by `ComboButton` to a readable store of its button group; read by a
 * root `Menu`, which places itself against the group. Focus still returns
 * to the menu's `anchor`, the trigger.
 */
export const MENU_PLACEMENT_CONTEXT_KEY: "carbon:MenuPlacement";

/**
 * Set by `MenuButton` and `ComboButton` to a writable store of the arrow
 * key that opened their `Menu`, or `null`; read by a root `Menu` to focus
 * its first or last item.
 */
export const MENU_OPEN_CONTEXT_KEY: "carbon:MenuOpenKey";
