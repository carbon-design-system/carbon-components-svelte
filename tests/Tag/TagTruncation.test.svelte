<script lang="ts">
  import OperationalTag from "carbon-components-svelte/Tag/OperationalTag.svelte";
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  export let kind: "tag" | "operational" | "selectable" = "tag";
  export let maxWidth: string | undefined = undefined;
  export let filter = false;
  export let interactive = false;
  export let href: string | undefined = undefined;
  export let disabled = false;
  export let open = false;
  export let roving = false;
  export let tabindex: number | undefined = undefined;
  export let label =
    "status:active AND region:us-south AND service:cloud-object-storage";
</script>

{#if kind === "operational"}
  <OperationalTag {disabled} bind:open>
    {label}
    <svelte:fragment slot="content">Retention policy</svelte:fragment>
  </OperationalTag>
{:else if kind === "selectable"}
  <SelectableTag {disabled}>{label}</SelectableTag>
{:else if roving}
  <TagSet navigation="roving" multiline>
    <Tag {maxWidth} {filter} {interactive} {href} {disabled} on:close>
      {label}
    </Tag>
  </TagSet>
{:else}
  <Tag {maxWidth} {filter} {interactive} {href} {disabled} {tabindex} on:close>
    {label}
  </Tag>
{/if}
