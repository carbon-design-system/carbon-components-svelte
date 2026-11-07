<script lang="ts">
  import TruncatedList from "carbon-components-svelte/TruncatedList/TruncatedList.svelte";
  import type { ComponentProps } from "svelte";

  type $$Props = ComponentProps<TruncatedList> & { highlight?: boolean };

  export let highlight = false;
</script>

{#if highlight}
  <TruncatedList data-testid="list" {...$$restProps}>
    <svelte:fragment slot="item" let:label let:index>
      <mark data-testid="item-{index}">{label}</mark>
    </svelte:fragment>
  </TruncatedList>
{:else}
  <TruncatedList data-testid="list" {...$$restProps} />
{/if}
