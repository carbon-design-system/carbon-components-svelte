<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import FieldA11yFields from "./FieldA11yFields.test.svelte";

  export let kind = "TextInput";
  export let fluid = false;
  export let props: Record<string, unknown> = {};
</script>

{#if fluid}
  <FluidForm><FieldA11yFields {kind} {props} /></FluidForm>
{:else}
  <FieldA11yFields {kind} {props} />
{/if}
