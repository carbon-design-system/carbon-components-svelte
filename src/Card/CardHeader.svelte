<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} actions - A `CardActions` with quick actions, in the top inline-end corner. The title leaves room for them. A clickable card doesn't render them.
   */

  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  /** @type {import("svelte/store").Readable<boolean>} */
  const clickable = getContext("carbon:Card")?.clickable ?? readable(false);
</script>

<div
  class:bx--card__header={true}
  class:bx--card__header--actions={$$slots.actions && !$clickable}
  {...$$restProps}
>
  <slot />
  <slot name="actions" />
</div>
