<script lang="ts">
  import { Select, SelectItem } from "carbon-components-svelte";

  export let open = false;
</script>

<button type="button" on:click={() => (open = !open)}>toggle</button>
{#if open}
  <Select
    labelText="Toggled select"
    on:update={(e) => console.log("update", e.detail)}
  >
    <SelectItem value="test" text="test" />
  </Select>
{/if}
