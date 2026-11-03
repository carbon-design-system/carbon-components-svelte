<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  /** Also pass the deprecated `iconRight` slot. */
  export let withIconRight = false;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

{#if withIconRight}
  <ComboBox {items} selectedId="0" open labelText="Icon end">
    <svelte:fragment slot="iconEnd" let:item let:selected>
      <span data-testid="end-{item.id}" data-selected={selected}>E</span>
    </svelte:fragment>
    <svelte:fragment slot="iconRight" let:item>
      <span data-testid="right-{item.id}">R</span>
    </svelte:fragment>
  </ComboBox>
{:else}
  <ComboBox {items} selectedId="0" open labelText="Icon end">
    <svelte:fragment slot="iconEnd" let:item let:selected>
      <span data-testid="end-{item.id}" data-selected={selected}>E</span>
    </svelte:fragment>
  </ComboBox>
{/if}
