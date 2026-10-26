<script>
  import { uniqueId } from "../utils/unique-id.js";

  /**
   * Specify the toggle size.
   * Also accepts Carbon v11's `"md"` (`"default"`).
   * @type {"default" | "sm" | "md"}
   */
  export let size = "default";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the input element */
  export let id = uniqueId();
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <input
    type="checkbox"
    {id}
    class:bx--toggle={true}
    class:bx--toggle-input={true}
    class:bx--toggle-input--small={size === "sm"}
    class:bx--skeleton={true}
  />
  <label
    aria-label={labelText && !hideLabel
      ? undefined
      : labelText || ($$props["aria-label"] ?? "Toggle is loading")}
    for={id}
    class:bx--toggle-input__label={true}
    class:bx--skeleton={true}
  >
    {#if (labelText || $$slots.labelChildren) && !hideLabel}
      <div><slot name="labelChildren">{labelText}</slot></div>
    {/if}
    <span
      class:bx--toggle__switch={true}
      style:margin-top={hideLabel ? 0 : undefined}
    >
      <span class:bx--toggle__text--left={true}></span>
    </span>
  </label>
</div>
