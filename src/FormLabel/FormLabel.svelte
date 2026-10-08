<script>
  let forId = undefined;

  /**
   * Set the id of the control this label is for.
   * Inside a `FormItem`, defaults to the item's `controlId`.
   * @type {string}
   */
  export { forId as for };

  /**
   * Set the id of the control this label is for.
   * @deprecated use `for` instead. Despite its name, this sets the
   * label's `for` attribute, not its `id`.
   * @type {string}
   */
  export let id = undefined;

  /**
   * Set to `true` to use disabled styles.
   * Inside a `FormItem`, defaults to the item's `disabled`.
   * @type {boolean}
   */
  export let disabled = undefined;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { FORM_ITEM_CONTEXT_KEY } from "../constants/context-keys.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  const formItem = getContext(FORM_ITEM_CONTEXT_KEY);
  const controlId = formItem?.controlId ?? readable(undefined);
  const parentDisabled = formItem?.disabled ?? readable(false);
  const setPartId = formItem?.part("label") ?? noop;
  const fallbackId = uniqueId();

  $: htmlFor = forId ?? id ?? $controlId ?? fallbackId;
  // Only a label for the item's own control labels it.
  $: labelId =
    formItem && htmlFor === $controlId ? `label-${$controlId}` : undefined;
  $: setPartId(labelId);

  onMount(() => () => setPartId(undefined));
</script>

<label
  id={labelId}
  class:bx--label={true}
  class:bx--label--disabled={disabled ?? $parentDisabled}
  for={htmlFor}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</label>
