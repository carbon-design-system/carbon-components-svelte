<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
</script>

<Dropdown labelText="Contact" items={[]} open emptyText="No contact methods">
  <svelte:fragment slot="empty">Nothing to pick yet</svelte:fragment>
</Dropdown>
