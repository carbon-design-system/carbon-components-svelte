<script lang="ts">
  import Box from "carbon-components-svelte/Box/Box.svelte";
</script>

<Box>Default box</Box>
<Box tag="section" fill="layer-01">Layer fill</Box>
<Box fill="background" border="subtle">Fill and border</Box>
<Box fill="layer-accent">Accent fill</Box>
<Box fill="brand">Brand fill</Box>
<Box border="strong" borderStyle="dashed">Dashed border</Box>
<Box borderStyle="dashed">No border, dashed style</Box>
<Box border="strong" borderWidth={2}>Thick border</Box>
<Box borderWidth={2}>No border, custom width</Box>
<Box border="subtle" borderSide="top">Top border only</Box>
<Box borderSide="top">No border, top side only</Box>
<Box border="strong" borderSide="left" borderWidth={3}>Thick left border</Box>
<Box shadow>Raised shadow</Box>
<Box display="flex">Flex display</Box>
<Box display="flex" gap={3} data-testid="gap-scale">Gap scale</Box>
<Box display="flex" gap="2rem" data-testid="gap-custom">Gap custom</Box>
<Box display="flex" gap={0} data-testid="gap-zero">Gap zero</Box>
<Box display="flex" direction="column" data-testid="direction-column"
  >Direction column</Box
>
<Box display="flex" wrap="wrap" data-testid="wrap">Wrap</Box>
<Box alignSelf="stretch" grow data-testid="flex-item">Flex item props</Box>
<Box display="flex" align="center" data-testid="align-center">Align center</Box>
<Box display="flex" justify="space-between" data-testid="justify-between"
  >Justify space-between</Box
>
<Box display="grid" columns={3} data-testid="grid-columns-number"
  >Grid columns number</Box
>
<Box display="grid" columns="200px 1fr 200px" data-testid="grid-columns-string"
  >Grid columns string</Box
>
<Box columns={3} data-testid="grid-columns-no-grid"
  >Columns without grid display</Box
>
<Box overflow="auto">Auto overflow</Box>
<Box hideBelow="md" data-testid="hide-below-md">Hide below md</Box>
<Box hideAbove="md" data-testid="hide-above-md">Hide above md</Box>
<Box overflowX="auto" overflowY="hidden">Axis overflow</Box>
<Box overflow="hidden" overflowX="auto">Overflow with x override</Box>
<Box padding={5}>Padding scale</Box>
<Box padding="1.5rem">Custom padding</Box>
<Box paddingX={3} paddingY={5}>Axis padding</Box>
<Box padding="1rem" paddingX={3} data-testid="padding-axis-over-custom"
  >Padding axis over custom</Box
>
<Box margin="1rem" marginY={3} data-testid="margin-axis-over-custom"
  >Margin axis over custom</Box
>
<Box margin={4}>Margin scale</Box>
<Box marginY={7} marginTop={3} data-testid="margin-top-scale"
  >Margin top scale</Box
>
<Box marginBottom="1.5rem" marginLeft={0} data-testid="margin-side-custom"
  >Margin side custom</Box
>
<Box margin="1rem" marginTop={3} data-testid="margin-side-over-custom"
  >Margin side over custom</Box
>
<Box fullWidth maxWidth={480}>Full width capped</Box>
<Box width="12rem" minWidth="8rem">Custom width</Box>
<Box fill="layer-02" padding={6} border="subtle" class="combined"
  >Combined modifiers</Box
>
<Box padding={0} data-testid="padding-zero">Padding zero</Box>
<Box margin={0} data-testid="margin-zero">Margin zero</Box>
<Box minHeight={0} data-testid="min-height-zero">Min height zero</Box>
<Box
  data-testid="click-test"
  on:click={() => {
    console.log("clicked");
  }}
>
  Clickable box
</Box>
