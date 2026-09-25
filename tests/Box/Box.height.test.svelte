<script lang="ts">
  import Box from "carbon-components-svelte/Box/Box.svelte";
</script>

<Box minHeight="viewport" data-testid="viewport-min-height"
  >Min height viewport</Box
>
<Box height={7} data-testid="scale-height">Scale height</Box>
<Box height="24rem" data-testid="custom-height">Custom height</Box>
<Box position="sticky" top={0} data-testid="sticky-top">Sticky top</Box>
<Box position="sticky" left={0} data-testid="sticky-left">Sticky left</Box>
<Box position="relative" right="2rem" data-testid="relative-right"
  >Relative right</Box
>
