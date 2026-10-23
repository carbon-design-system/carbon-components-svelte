<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
</script>

<MultiSelect labelText="Contact" items={[]} open emptyText="No contact methods">
  <svelte:fragment slot="empty">Nothing to pick yet</svelte:fragment>
</MultiSelect>
