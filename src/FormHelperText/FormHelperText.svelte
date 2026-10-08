<script>
  /**
   * @restProps {div}
   */

  /**
   * Set an id for the helper text element.
   * Inside a `FormItem`, defaults to `helper-{controlId}`, and the
   * item's control lists it in `aria-describedby`.
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
  import { buildFieldIds } from "../utils/field-status.js";
  import { noop } from "../utils/noop.js";

  const formItem = getContext(FORM_ITEM_CONTEXT_KEY);
  const controlId = formItem?.controlId ?? readable(undefined);
  const parentDisabled = formItem?.disabled ?? readable(false);
  const setPartId = formItem?.part("helper") ?? noop;

  $: helperId = id ?? buildFieldIds($controlId).helperId;
  $: setPartId(helperId);

  onMount(() => () => setPartId(undefined));
</script>

<div
  id={helperId}
  class:bx--form__helper-text={true}
  class:bx--form__helper-text--disabled={disabled ?? $parentDisabled}
  {...$$restProps}
>
  <slot />
</div>
