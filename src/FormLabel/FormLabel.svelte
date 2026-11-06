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
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Set to `true` to use disabled styles.
   * Inside a `FormItem`, defaults to the item's `disabled`. A disabled
   * fieldset around it applies either way.
   * @type {boolean | undefined}
   */
  export let disabled = undefined;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { FORM_ITEM_CONTEXT_KEY } from "../constants/context-keys.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { useId } from "../utils/id-scope.js";

  const context = getContext(FORM_ITEM_CONTEXT_KEY);
  // A FormGroup's fieldset is named by its legend, not a label.
  const formItem = context?.group ? undefined : context;
  const controlId = formItem?.controlId ?? readable(undefined);
  const parentDisabled = formItem?.disabled ?? readable(false);
  // A disabled fieldset around the label disables it too.
  let inDisabledFieldset = false;
  const part = formItem?.part("label");
  const fallbackId = useId("form-label");

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
  use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
  id={labelId}
  class:bx--label={true}
  class:bx--label--disabled={(disabled ?? $parentDisabled) ||
    inDisabledFieldset}
  for={htmlFor}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</label>
