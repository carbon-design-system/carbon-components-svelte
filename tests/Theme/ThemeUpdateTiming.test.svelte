<svelte:options accessors />

<script lang="ts">
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";
  import type { ComponentProps } from "svelte";

  export let theme: ComponentProps<Theme>["theme"] = "white";
  export let onUpdate: ((detail: { theme: string }) => void) | undefined =
    undefined;
</script>

<Theme {theme} on:update={(e) => onUpdate?.(e.detail)} />
