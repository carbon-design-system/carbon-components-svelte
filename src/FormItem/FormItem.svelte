<script>
  /**
   * @restProps {div}
   * @slot {{ control: import("svelte/action").Action<HTMLElement>; controlId: string; labelId: string | undefined; describedBy: string | undefined; invalid: boolean; warn: boolean; size: "xs" | "sm" | "xl" | undefined; fluid: boolean; }}
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

  import { getContext, setContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import {
    FORM_CONTEXT_KEY,
    FORM_ITEM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { createFormParts, partsDescribedBy } from "../utils/form-parts.js";
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

  const formContext = getContext(FORM_CONTEXT_KEY);
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY) ?? readable(undefined);
  const fluid = !!formContext?.isFluid;

  const sharedControlId = writable(controlId);
  const sharedDisabled = writable(disabled);

  /** Ids of the mounted parts by kind, in registration order. */
  const formParts = createFormParts();
  const parts = formParts.parts;
  /**
   * Registers a mounted part's id under its kind.
   * @type {(kind: "label" | "helper" | "invalid" | "warn") => (id: string | undefined) => void}
   */
  const part = formParts.part;

  const controlState = writable({
    id: controlId,
    labelId: undefined,
    describedBy: undefined,
    invalid: false,
  });

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
    let ownDescribedBy = node.getAttribute("aria-describedby");
    const labelledByLabel =
      !LABELABLE.has(node.localName) &&
      !node.hasAttribute("aria-labelledby") &&
      !node.hasAttribute("aria-label");
    let appliedInvalid = false;
    let state;
    /** @type {string | undefined} */
    let describedBy;

    function applyDescribedBy() {
      describedBy = joinDescribedBy(ownDescribedBy, state.describedBy);
      setAttribute(node, "aria-describedby", describedBy);
    }

    // A reactive `aria-describedby` on the control overwrites the merged
    // value; treat any write that isn't ours as the new own value.
    const observer = new MutationObserver(() => {
      const live = node.getAttribute("aria-describedby");
      if ((live ?? undefined) === describedBy) return;
      ownDescribedBy = live;
      applyDescribedBy();
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["aria-describedby"],
    });

    const unsubscribe = controlState.subscribe((next) => {
      state = next;
      node.id = state.id;
      applyDescribedBy();
      if (labelledByLabel) setAttribute(node, "aria-labelledby", state.labelId);
      if (state.invalid) {
        node.setAttribute("aria-invalid", "true");
        appliedInvalid = true;
      } else if (appliedInvalid) {
        node.removeAttribute("aria-invalid");
        appliedInvalid = false;
      }
    });

    return {
      destroy() {
        observer.disconnect();
        unsubscribe();
      },
    };
  }

  $: sharedControlId.set(controlId);
  $: sharedDisabled.set(disabled);
  $: labelId = $parts.label[0];
  $: invalid = $parts.invalid.length > 0;
  $: warn = $parts.warn.length > 0;
  $: describedBy = partsDescribedBy($parts);
  $: controlState.set({
    id: controlId,
    labelId,
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
  <slot
    {control}
    {controlId}
    {labelId}
    {describedBy}
    {invalid}
    {warn}
    size={$formSize}
    {fluid}
  />
</div>
