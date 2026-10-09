<script lang="ts">
  import { Box, Content, Stack, Text } from "carbon-components-svelte";
  import ComponentDocLayout from "../components/ComponentDocLayout.svelte";

  export let title = "";
  export let description = "";
</script>

<svelte:head>
  <title>{title} · Carbon Components Svelte</title>
  {#if description}
    <meta name="description" content={description}>
  {/if}
</svelte:head>

<Content>
  <ComponentDocLayout aside={false}>
    <Box
      display="flex"
      direction="column"
      gap={3}
      tag="section"
      class="hero band hero--component"
    >
      <Stack gap={7}>
        <Text tag="h1" type="expressive-heading-06" color="primary">
          {title}
        </Text>
        {#if description}
          <div class="hero__description">
            <Text
              type="productive-heading-04"
              color="secondary"
              maxWidth="52ch"
            >
              {description}
            </Text>
          </div>
        {/if}
      </Stack>
    </Box>
    <slot />
  </ComponentDocLayout>
</Content>

<style>
  .hero__description {
    margin-top: var(--cds-spacing-06);
    margin-bottom: var(--cds-spacing-04);
  }
</style>
