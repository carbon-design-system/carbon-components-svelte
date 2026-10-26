<script lang="ts">
  import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  export let open = false;
  export let disabled = false;
  export let inSet = false;
  export let action = false;
  export let withIcon = false;
  export let align: "start" | "center" | "end" = "start";
  export let direction: "top" | "bottom" = "bottom";
  export let onClick: () => void = () => {};
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<button type="button">Outside</button>

{#if action}
  <OperationalTag icon={withIcon ? Add : undefined} on:click={onClick}>
    Run scan
  </OperationalTag>
{:else if inSet}
  <TagSet size="sm">
    <OperationalTag>In a set</OperationalTag>
  </TagSet>
{:else}
  <OperationalTag
    id="policies"
    bind:open
    {disabled}
    {align}
    {direction}
    on:open={onOpen}
    on:close={onClose}
  >
    3 policies
    <svelte:fragment slot="content">
      <a href="#a">Retention</a>
    </svelte:fragment>
  </OperationalTag>
{/if}
