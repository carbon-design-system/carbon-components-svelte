<script>
  import { uniqueId } from "../utils/unique-id.js";

  /** Set an id to be used by the label element */
  export let id = uniqueId();
</script>

<label
  class:bx--label={true}
  for={id}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</label>
