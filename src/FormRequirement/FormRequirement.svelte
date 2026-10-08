<script>
  /**
   * @restProps {div}
   */

  /**
   * Specify the kind of message.
   * An `"invalid"` message is announced with `role="alert"`.
   * @type {"invalid" | "warn"}
   */
  export let kind = "invalid";

  /**
   * Set an id for the message element.
   * Inside a `FormItem`, defaults to `error-{controlId}` or
   * `warn-{controlId}`, and the item's control lists it in
   * `aria-describedby`. An invalid message also sets the control's
   * `aria-invalid` while it's mounted.
   * @type {string}
   */
  export let id = undefined;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { FORM_ITEM_CONTEXT_KEY } from "../constants/context-keys.js";
  import { buildFieldIds } from "../utils/field-status.js";

  const formItem = getContext(FORM_ITEM_CONTEXT_KEY);
  const controlId = formItem?.controlId ?? readable(undefined);
  const setInvalidId = formItem?.part("invalid");
  const setWarnId = formItem?.part("warn");

  $: invalid = kind === "invalid";
  $: fieldIds = buildFieldIds($controlId);
  $: messageId = id ?? (invalid ? fieldIds.errorId : fieldIds.warnId);
  $: setInvalidId?.(invalid ? messageId : undefined);
  $: setWarnId?.(invalid ? undefined : messageId);

  onMount(() => () => {
    setInvalidId?.(undefined);
    setWarnId?.(undefined);
  });
</script>

<div
  id={messageId}
  role={invalid ? "alert" : undefined}
  class:bx--form-requirement={true}
  class:bx--form-requirement--invalid={invalid}
  class:bx--form-requirement--warn={!invalid}
  {...$$restProps}
>
  <slot />
</div>
