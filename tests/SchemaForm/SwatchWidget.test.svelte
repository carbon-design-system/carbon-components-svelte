<script lang="ts">
  import type { FieldNode } from "carbon-components-svelte/SchemaForm/field-config.js";
  import { createEventDispatcher } from "svelte";

  export let value = "";
  export let field: FieldNode;
  export let id: string | undefined = undefined;
  export let name: string | undefined = undefined;
  export let label = "";
  export let invalid = false;
  export let invalidText = "";
  $$restProps;

  const dispatch = createEventDispatcher();
</script>

<fieldset {id}>
  <legend>{label}</legend>
  {#each field.options ?? [] as option (option.value)}
    <label>
      <input
        type="radio"
        {name}
        value={option.value}
        checked={value === option.value}
        on:change={() => dispatch("change", option.value)}
      />
      {option.label}
    </label>
  {/each}
  {#if invalid}<p role="alert">{invalidText}</p>{/if}
</fieldset>
