<script lang="ts">
  import Box from "carbon-components-svelte/Box/Box.svelte";
</script>

<Box>Default box</Box>
<Box tag="section" fill="layer-01">Layer fill</Box>
<Box fill="background" border="subtle">Fill and border</Box>
<Box border="strong" borderStyle="dashed">Dashed border</Box>
<Box borderStyle="dashed">No border, dashed style</Box>
<Box border="strong" borderWidth={2}>Thick border</Box>
<Box borderWidth={2}>No border, custom width</Box>
<Box border="subtle" borderSide="top">Top border only</Box>
<Box borderSide="top">No border, top side only</Box>
<Box border="strong" borderSide="left" borderWidth={3}>Thick left border</Box>
<Box shadow>Raised shadow</Box>
<Box display="flex">Flex display</Box>
<Box overflow="auto">Auto overflow</Box>
<Box padding={5}>Padding scale</Box>
<Box padding="1.5rem">Custom padding</Box>
<Box paddingX={3} paddingY={5}>Axis padding</Box>
<Box margin={4}>Margin scale</Box>
<Box fullWidth maxWidth={480}>Full width capped</Box>
<Box width="12rem" minWidth="8rem">Custom width</Box>
<Box fill="layer-02" padding={6} border="subtle" class="combined"
  >Combined modifiers</Box
>
