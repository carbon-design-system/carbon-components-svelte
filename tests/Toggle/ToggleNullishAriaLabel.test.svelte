<script lang="ts">
  import { Toggle } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let ariaLabel: NonNullable<ComponentProps<Toggle>["aria-label"]> = "";
</script>

<Toggle hideLabel labelText="" aria-label={ariaLabel} />
