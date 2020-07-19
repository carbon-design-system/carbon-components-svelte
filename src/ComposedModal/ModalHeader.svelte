<script>
  export let title = "";
  export let label = "";
  export let labelClass = "";
  export let titleClass = "";
  export let closeClass = "";
  export let closeIconClass = "";
  export let iconDescription = "Close";

  import { getContext } from "svelte";
  import Close20 from "carbon-icons-svelte/lib/Close20";

  const { closeModal } = getContext("ComposedModal");
</script>

<div class:bx--modal-header={true} {...$$restProps}>
  {#if label}
    <p
      class:bx--modal-header__label={true}
      class:bx--type-delta={true}
      class:labelClass>
      {label}
    </p>
  {/if}
  {#if title}
    <p
      class:bx--modal-header__heading={true}
      class:bx--type-beta={true}
      class:titleClass>
      {title}
    </p>
  {/if}
  <slot />
  <button
    type="button"
    title={iconDescription}
    aria-label={iconDescription}
    class:bx--modal-close={true}
    class:closeClass
    on:click
    on:click={closeModal}>
    <Close20 class="bx--modal-close__icon {closeIconClass}" />
  </button>
</div>
