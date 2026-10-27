<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Coachmark from "../../src/Coachmark/Coachmark.svelte";

  export let open: ComponentProps<Coachmark>["open"] = false;
  export let titleText: ComponentProps<Coachmark>["titleText"] =
    "Export in bulk";
  export let closeOnOutsideClick: ComponentProps<Coachmark>["closeOnOutsideClick"] = true;
  export let selectorPrimaryFocus: ComponentProps<Coachmark>["selectorPrimaryFocus"] =
    "[data-modal-primary-focus]";
  export let step: ComponentProps<Coachmark>["step"] = 0;
  export let withActions = false;
  export let onChange: (step: number) => void = () => {};
  export let onOpen: (detail: { trigger: string }) => void = () => {};
  export let onClose: (detail: { trigger: string }) => void = () => {};
  export let onCloseEvent: (event: CustomEvent) => void = () => {};
</script>

<input data-testid="unrelated" aria-label="Unrelated" />
<button type="button" data-testid="outside" on:click={() => (open = true)}>
  Outside
</button>
<p data-testid="bound-step">{step}</p>
<Coachmark
  id="cm"
  bind:open
  bind:step
  {titleText}
  {closeOnOutsideClick}
  {selectorPrimaryFocus}
  {...$$restProps}
  on:open={(e) => onOpen(e.detail)}
  on:change={(e) => onChange(e.detail)}
  on:close={(e) => {
    onClose(e.detail);
    onCloseEvent(e);
  }}
>
  <p data-testid="body">Select rows, then export them. Step {step}</p>
  <svelte:fragment slot="actions" let:close>
    {#if withActions}
      <button type="button" data-modal-primary-focus on:click={close}>
        Try it
      </button>
    {/if}
  </svelte:fragment>
</Coachmark>
