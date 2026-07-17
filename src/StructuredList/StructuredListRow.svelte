<script>
  /** Set to `true` to use as a header */
  export let head = false;

  /** Set to `true` to render a label slot */
  export let label = false;

  /**
   * Specify the tabindex.
   * @deprecated no longer applied here -- the row's own `<label>` isn't
   * a tab stop anymore. Set `tabindex` on `StructuredListInput` instead,
   * which now owns focus for the selectable row.
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  import { getContext } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import StructuredListCell from "./StructuredListCell.svelte";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selection = ctx?.selection ?? false;
  const icon = ctx?.icon ?? CheckmarkFilled;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if label}
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <label
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
    {#if selection}
      <StructuredListCell style="width: 1px; white-space: nowrap;">
        <svelte:component this={icon} class="bx--structured-list-svg" />
      </StructuredListCell>
    {/if}
  </label>
{:else}
  <!-- svelte-ignore a11y-interactive-supports-focus -->
  <div
    role={selection ? undefined : "row"}
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
    {#if selection && head}
      <StructuredListCell head style="width: 1px;">
        <span class:bx--visually-hidden={true}>Select row</span>
      </StructuredListCell>
    {/if}
  </div>
{/if}
