<script lang="ts">
  import { Column, Row, Stack, Text } from "carbon-components-svelte";
  import type { ComponentType } from "svelte";

  export let variant: "example" | "step" | "principle" = "example";
  export let icon: ComponentType | undefined = undefined;
  export let step = "";
  export let eyebrow = "";
  export let title = "";
  export let description = "";
  export let descriptionMaxWidth = "40ch";
  export let rightColumnClass = "code-col";
  export let fullWidth = false;
  $: rowClass =
    variant === "example"
      ? "example-row"
      : variant === "step"
        ? "step-row"
        : "principle-row";
</script>

<Row class={rowClass}>
  {#if $$slots.left}
    <slot name="left" />
  {:else if variant === "step" && !fullWidth}
    <Column sm={4} md={8} lg={4}>
      <Stack gap={3}>
        <Text tag="span" type="productive-heading-05" color="secondary">
          {step}
        </Text>
        <Stack gap={1}>
          <Text tag="h3" type="productive-heading-03" color="primary">
            {title}
          </Text>
          <Text type="body-long-01" color="secondary" maxWidth="36ch">
            {description}
          </Text>
        </Stack>
      </Stack>
    </Column>
  {:else if variant === "principle"}
    <Column sm={4} md={2} lg={4}>
      <Stack gap={4}>
        <Text tag="h3" type="productive-heading-04" color="primary">
          {title}
        </Text>
        {#if icon}
          <svelte:component this={icon} size={24} class="principle-icon" />
        {/if}
      </Stack>
    </Column>
    <Column sm={4} md={6} lg={8}>
      <Text type="body-long-02" color="secondary" maxWidth="52ch">
        {description}
      </Text>
    </Column>
  {:else}
    <Column sm={4} md={8} lg={4}>
      <Stack gap={3}>
        {#if eyebrow}
          <Text type="caption-02" color="secondary">{eyebrow}</Text>
        {/if}
        <Text tag="h2" type="productive-heading-05" color="primary">
          {title}
        </Text>
        <Text
          type="body-long-01"
          color="secondary"
          maxWidth={descriptionMaxWidth}
        >
          {description}
        </Text>
      </Stack>
    </Column>
  {/if}

  {#if $$slots.right}
    {#if fullWidth}
      <Column lg={12} class={rightColumnClass}>
        <slot name="right" />
      </Column>
    {:else if $$slots.left}
      <slot name="right" />
    {:else if variant !== "principle"}
      <Column sm={4} md={8} lg={8} class={rightColumnClass}>
        <slot name="right" />
      </Column>
    {/if}
  {/if}
</Row>
