import type { WidgetComponent } from "./create-form.js";

/**
 * The widget for each field `type`. Pass your own map as `widgets` to add a
 * type or to replace one; it is merged over this one.
 *
 * A widget is a component that takes `value`, `field` (the compiled field),
 * `id`, `name`, `label`, `helperText`, `placeholder`, `invalid`,
 * `invalidText`, `warn`, `warnText`, `disabled`, `readonly` and `required`
 * as props, and dispatches `change` with the new value as `detail`.
 */
export const defaultWidgets: Record<string, WidgetComponent>;
