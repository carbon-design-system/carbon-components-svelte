<script lang="ts">
  import Bleed from "carbon-components-svelte/Bleed/Bleed.svelte";
</script>

<Bleed data-testid="scale" horizontal={5} vertical={5}
  >Full bleed, scale step</Bleed
>
<Bleed data-testid="custom" horizontal="2rem">Custom horizontal</Bleed>
<Bleed data-testid="custom-var" vertical="var(--gap)">CSS variable</Bleed>
<Bleed data-testid="per-side" vertical={5} top={0}
  >Top pinned, rest bleeds</Bleed
>
<Bleed data-testid="tag" tag="section">Section tag</Bleed>
