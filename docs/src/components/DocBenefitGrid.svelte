<script lang="ts">
  import { Stack, Text } from "carbon-components-svelte";
  import type { ComponentType } from "svelte";

  export let items: {
    icon?: ComponentType;
    title: string;
    body: string;
  }[] = [];
  export let titleTag: "h3" | "h4" = "h4";
  export let titleType: "heading-02" | "productive-heading-03" = "heading-02";
</script>

<div class="benefit-grid">
  {#each items as item (item.title)}
    <Stack gap={2}>
      {#if item.icon}
        <svelte:component this={item.icon} size={20} class="benefit-icon" />
      {/if}
      <Text tag={titleTag} type={titleType} color="primary">
        {item.title}
      </Text>
      <Text type="body-long-01" color="secondary" maxWidth="48ch">
        {item.body}
      </Text>
    </Stack>
  {/each}
</div>
