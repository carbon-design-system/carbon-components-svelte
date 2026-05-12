<script lang="ts">
  import { ToggleSkeleton } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let ariaLabel: NonNullable<
    ComponentProps<ToggleSkeleton>["aria-label"]
  > = "";
</script>

<ToggleSkeleton labelText="" aria-label={ariaLabel} />
