<script lang="ts">
  import AspectRatio from "carbon-components-svelte/AspectRatio/AspectRatio.svelte";
  import type { ComponentProps } from "svelte";

  type Ratio = ComponentProps<AspectRatio>["ratio"];

  // Invalid at the type level on purpose; exercises the runtime fallback.
  const invalidWord = "abc" as string as Ratio;
  const invalidColon = "16:9" as string as Ratio;
</script>

<AspectRatio ratio="21x9" data-testid="custom-ratio">Custom</AspectRatio>
<AspectRatio ratio="2.35x1" data-testid="custom-decimal">Decimal</AspectRatio>
<AspectRatio ratio="0x1" data-testid="invalid-zero">Invalid zero</AspectRatio>
<AspectRatio ratio={invalidWord} data-testid="invalid-word">
  Invalid word
</AspectRatio>
<AspectRatio ratio={invalidColon} data-testid="invalid-colon">
  Invalid colon
</AspectRatio>
<AspectRatio ratio="2x1" data-testid="named-ratio">Named</AspectRatio>
