<script lang="ts">
  import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";

  export let kind: "tag" | "operational" | "selectable" = "tag";
  export let filter = false;
  export let interactive = false;
  export let href: string | undefined = undefined;
</script>

{#if kind === "operational"}
  <OperationalTag>
    Retention
    <svelte:fragment slot="content">Retention policy</svelte:fragment>
  </OperationalTag>
{:else if kind === "selectable"}
  <SelectableTag>Retention</SelectableTag>
{:else}
  <Tag {filter} {interactive} {href}>Retention</Tag>
{/if}
