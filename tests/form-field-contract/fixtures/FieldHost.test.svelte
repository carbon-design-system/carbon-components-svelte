<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import type { ComponentType } from "svelte";

  export let component: ComponentType;
  export let fieldProps: Record<string, unknown> = {};
  /** Inherit fluid from a FluidForm instead of the `fluid` prop. */
  export let inFluidForm = false;
</script>

<!-- `slot` can't sit inside an `{#if}` in Svelte 5, so each branch renders the field whole. -->
{#if inFluidForm}
  <FluidForm>
    <svelte:component this={component} {...fieldProps}>
      <svelte:fragment slot="labelChildren">Field</svelte:fragment>
    </svelte:component>
  </FluidForm>
{:else}
  <svelte:component this={component} {...fieldProps}>
    <svelte:fragment slot="labelChildren">Field</svelte:fragment>
  </svelte:component>
{/if}
