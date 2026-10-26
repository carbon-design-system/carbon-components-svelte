<script>
  /**
   * @restProps {div}
   */

  /**
   * Set an id for the helper text element.
   * Inside a `FormItem`, defaults to `helper-{controlId}` (`-1`, `-2`,
   * and so on for later helper texts), and the item's control lists it
   * in `aria-describedby`.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Set to `true` to use disabled styles.
   * Inside a `FormItem`, defaults to the item's `disabled`.
   * @type {boolean | undefined}
   */
  export let disabled = undefined;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { FORM_ITEM_CONTEXT_KEY } from "../constants/context-keys.js";
  import { buildFieldIds } from "../utils/field-status.js";

  const formItem = getContext(FORM_ITEM_CONTEXT_KEY);
  const controlId = formItem?.controlId ?? readable(undefined);
  const parentDisabled = formItem?.disabled ?? readable(false);
  const part = formItem?.part("helper");

  $: helperId = id ?? part?.numbered(buildFieldIds($controlId).helperId);
  $: part?.(helperId);

  onMount(() => () => part?.(undefined));
</script>

<div
  id={helperId}
  class:bx--form__helper-text={true}
  class:bx--form__helper-text--disabled={disabled ?? $parentDisabled}
  {...$$restProps}
>
  <slot />
</div>
