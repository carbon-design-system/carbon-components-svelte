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
  import { uniqueId } from "../utils/unique-id.js";

  const context = getContext("carbon:FormItem");
  // A FormGroup's fieldset is named by its legend, not a label.
  const formItem = context?.group ? undefined : context;
  const controlId = formItem?.controlId ?? readable(undefined);
  const parentDisabled = formItem?.disabled ?? readable(false);
  const part = formItem?.part("label");
  const fallbackId = uniqueId();

  $: htmlFor = forId ?? id ?? $controlId ?? fallbackId;
  // Only a label for the item's own control labels it.
  $: labelId =
    formItem && htmlFor === $controlId
      ? part?.numbered(`label-${$controlId}`)
      : undefined;
  $: part?.(labelId);

  onMount(() => () => part?.(undefined));
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
