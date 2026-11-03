<script lang="ts">
  import type { ComponentType } from "svelte";

  export let component: ComponentType;
  export let fieldProps: Record<string, unknown> = {};
  export let disabled = false;
</script>

<fieldset {disabled}>
  <legend>Group</legend>
  <svelte:component this={component} {...fieldProps} />
</fieldset>
