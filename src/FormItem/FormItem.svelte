<script>
  /**
   * @restProps {div}
   * @slot {{ control: import("svelte/action").Action<HTMLElement>; controlId: string; describedBy: string | undefined; invalid: boolean; warn: boolean; }}
   */

  /**
   * Set the id of the control in this form item.
   * Child `FormLabel`, `FormHelperText`, and `FormRequirement`
   * components derive their `for` and `id` attributes from it.
   * Apply it to the control with the `control` slot prop action.
   */
  export let controlId = uniqueId();

  /** Set to `true` to style child labels and helper text as disabled */
  export let disabled = false;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { FORM_ITEM_CONTEXT_KEY } from "../constants/context-keys.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { uniqueId } from "../utils/unique-id.js";

  /** Elements a `<label for>` names; others need `aria-labelledby`. */
  const LABELABLE = new Set([
    "button",
    "input",
    "meter",
    "output",
    "progress",
    "select",
    "textarea",
  ]);

  const sharedControlId = writable(controlId);
  const sharedDisabled = writable(disabled);

  /** Ids of the mounted parts by kind, in registration order. */
  const parts = writable({ label: [], helper: [], invalid: [], warn: [] });

  const controlState = writable({
    id: controlId,
    labelId: undefined,
    describedBy: undefined,
    invalid: false,
  });

  /**
   * Create a setter that registers one part's id under `kind`.
   * Setting `undefined` unregisters it.
   * @param {"label" | "helper" | "invalid" | "warn"} kind
   * @returns {(id: string | undefined) => void}
   */
  function part(kind) {
    let registered = undefined;

    return function setPartId(id) {
      if (id === registered) return;
      parts.update((current) => {
        const ids = [...current[kind]];
        const index = registered === undefined ? -1 : ids.indexOf(registered);
        if (index !== -1) ids.splice(index, 1);
        if (id !== undefined) ids.push(id);
        return { ...current, [kind]: ids };
      });
      registered = id;
    };
  }

  setContext(FORM_ITEM_CONTEXT_KEY, {
    controlId: sharedControlId,
    disabled: sharedDisabled,
    part,
  });

  /**
   * @param {Element} node
   * @param {string} name
   * @param {string | undefined} value
   */
  function setAttribute(node, name, value) {
    if (value === undefined) node.removeAttribute(name);
    else node.setAttribute(name, value);
  }

  /**
   * Apply `controlId` as the element's `id`, and point its
   * `aria-describedby` at the mounted helper text and messages.
   * Sets `aria-invalid` while an invalid `FormRequirement` is mounted,
   * and `aria-labelledby` when the element is not a native labelable
   * element (e.g., a `div` with `role="combobox"`).
   * @type {import("svelte/action").Action<HTMLElement>}
   */
  function control(node) {
    const ownDescribedBy = node.getAttribute("aria-describedby");
    const labelledByLabel =
      !LABELABLE.has(node.localName) &&
      !node.hasAttribute("aria-labelledby") &&
      !node.hasAttribute("aria-label");
    let appliedInvalid = false;

    const unsubscribe = controlState.subscribe((state) => {
      node.id = state.id;
      setAttribute(
        node,
        "aria-describedby",
        joinDescribedBy(ownDescribedBy, state.describedBy),
      );
      if (labelledByLabel) setAttribute(node, "aria-labelledby", state.labelId);
      if (state.invalid) {
        node.setAttribute("aria-invalid", "true");
        appliedInvalid = true;
      } else if (appliedInvalid) {
        node.removeAttribute("aria-invalid");
        appliedInvalid = false;
      }
    });

    return { destroy: unsubscribe };
  }

  $: sharedControlId.set(controlId);
  $: sharedDisabled.set(disabled);
  $: invalid = $parts.invalid.length > 0;
  $: warn = $parts.warn.length > 0;
  $: describedBy = joinDescribedBy(
    ...$parts.invalid,
    ...$parts.warn,
    ...$parts.helper,
  );
  $: controlState.set({
    id: controlId,
    labelId: $parts.label[0],
    describedBy,
    invalid,
  });
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot {control} {controlId} {describedBy} {invalid} {warn} />
</div>
