<script lang="ts">
  import { Column, Row, Stack, Text } from "carbon-components-svelte";

  export let eyebrow = "";
  export let title = "";
  export let description = "";
  export let titleType: "productive-heading-05" | "productive-heading-06" =
    "productive-heading-05";
  export let gap: 4 | 6 = 4;
  export let maxWidth = "54ch";
  export let wide = false;
  export let balance = false;
</script>

<Row class="doc-section-header">
  <Column lg={wide ? 10 : 8} xlg={wide ? 8 : undefined}>
    <Stack {gap}>
      {#if eyebrow}
        <Text type="caption-02" color="secondary">{eyebrow}</Text>
      {/if}
      <Text tag="h2" type={titleType} color="primary" {balance}>
        {title}
      </Text>
      {#if $$slots.description}
        <slot name="description" />
      {:else if description}
        <Text type="body-long-02" color="secondary" {maxWidth}>
          {description}
        </Text>
      {/if}
      <slot />
    </Stack>
  </Column>
</Row>
