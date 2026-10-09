<script lang="ts">
  import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  export let open = false;
  export let disabled = false;
  export let inSet = false;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<button type="button">Outside</button>

{#if inSet}
  <TagSet size="sm">
    <OperationalTag>In a set</OperationalTag>
  </TagSet>
{:else}
  <OperationalTag
    id="policies"
    bind:open
    {disabled}
    on:open={onOpen}
    on:close={onClose}
  >
    3 policies
    <svelte:fragment slot="content">
      <a href="#a">Retention</a>
    </svelte:fragment>
  </OperationalTag>
{/if}
