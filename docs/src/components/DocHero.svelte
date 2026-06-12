<script lang="ts">
  import {
    Box,
    Column,
    Grid,
    Link,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import type { ComponentType } from "svelte";

  export let eyebrow = "";
  export let eyebrowHref = "";
  export let icon: ComponentType | undefined = undefined;
  export let title = "";
  export let titleType: "expressive-heading-04" | "productive-heading-05" =
    "productive-heading-05";
  export let description = "";
  export let descriptionHtml = "";
  export let descriptionMaxWidth = "60ch";
  export let balance = false;
</script>

<Box tag="section" class="hero band" paddingY={8}>
  <Grid>
    <Row style="margin-top: 2rem">
      <Column xlg={10} lg={12} md={8} sm={4}>
        <Stack gap={3}>
          {#if eyebrow}
            <Stack orientation="horizontal" gap={3} align="center">
              {#if icon}
                <svelte:component
                  this={icon}
                  size={16}
                  class="eyebrow-icon"
                  aria-hidden="true"
                />
              {/if}
              <Text type="caption-02" color="secondary">
                {#if eyebrowHref}
                  <Link inline href={eyebrowHref}>{eyebrow}</Link>
                {:else}
                  {eyebrow}
                {/if}
              </Text>
            </Stack>
          {/if}
          <Stack gap={7}>
            {#if $$slots.title}
              <slot name="title" />
            {:else}
              <Text
                tag="h1"
                type={titleType}
                color="primary"
                {balance}
                maxWidth={titleType === "expressive-heading-04" ? "32ch" : undefined}
              >
                {title}
              </Text>
            {/if}
            {#if $$slots.description}
              <slot name="description" />
            {:else if descriptionHtml}
              <Text
                type="body-long-02"
                color="secondary"
                maxWidth={descriptionMaxWidth}
              >
                {@html descriptionHtml}
              </Text>
            {:else if description}
              <Text
                type="body-long-02"
                color="secondary"
                maxWidth={descriptionMaxWidth}
              >
                {description}
              </Text>
            {/if}
            {#if $$slots.actions}
              <slot name="actions" />
            {/if}
          </Stack>
        </Stack>
      </Column>
    </Row>
  </Grid>
</Box>

<style>
  :global(.eyebrow-icon) {
    fill: var(--cds-text-secondary, var(--cds-text-02));
    flex-shrink: 0;
  }
</style>
