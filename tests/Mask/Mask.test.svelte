<script lang="ts">
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import { mask } from "carbon-components-svelte/utils/mask.js";
  import type { MaskParams } from "carbon-components-svelte/utils/mask.js";

  export let value = "";
  export let pattern: MaskParams["pattern"] = "(999) 999-9999";
  export let eager = false;
  export let onchange: MaskParams["onchange"] = undefined;
  export let onInput: (event: CustomEvent) => void = () => {};
  export let direct = false;
</script>

{#if direct}
  <input
    aria-label="Direct"
    bind:value
    use:mask={{ pattern, eager, onchange }}
  />
{:else}
  <div use:mask={{ pattern, eager, onchange }}>
    <TextInput bind:value labelText="Phone" on:input={onInput} />
  </div>
{/if}
<p data-testid="bound">{value}</p>
