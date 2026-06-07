<script>
  /** Set to `true` to use as a header */
  export let head = false;

  /** Set to `true` to render a label slot */
  export let label = false;

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  import { getContext, onMount } from "svelte";
  import { writable } from "svelte/store";

  const ctx = getContext("carbon:StructuredListWrapper");
  const selectedValue = ctx?.selectedValue ?? writable(undefined);
  const multiple = ctx?.multiple ?? false;

  let labelRef;
  let inputValue;

  onMount(() => {
    if (label && labelRef) {
      const input = labelRef.querySelector(
        'input[type="radio"], input[type="checkbox"]',
      );
      if (input) inputValue = input.value;
    }
  });

  $: isSelectable = label && inputValue !== undefined;
  $: ariaChecked = isSelectable
    ? multiple
      ? Array.isArray($selectedValue) && $selectedValue.includes(inputValue)
      : $selectedValue === inputValue
    : undefined;

  function handleKeydown(event) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if label}
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <label
    bind:this={labelRef}
    role={isSelectable ? (multiple ? "checkbox" : "radio") : undefined}
    aria-checked={ariaChecked}
    {tabindex}
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown={handleKeydown}
  >
    <slot />
  </label>
{:else}
  <!-- svelte-ignore a11y-interactive-supports-focus -->
  <div
    role="row"
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </div>
{/if}
