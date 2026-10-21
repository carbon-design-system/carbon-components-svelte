<svelte:options accessors />

<script lang="ts">
  import Theme from "carbon-components-svelte/Theme/Theme.svelte";
  import type { ComponentProps } from "svelte";

  export let theme: ComponentProps<Theme>["theme"] = "white";
  export let tokens: ComponentProps<Theme>["tokens"] = {};
  export let persist = false;
  export let persistKey = "theme";
  export let system = false;
  export let systemThemes: ComponentProps<Theme>["systemThemes"] | undefined =
    undefined;
  export let render: ComponentProps<Theme>["render"] = undefined;
  export let toggle: ComponentProps<Theme>["toggle"] = undefined;
  export let select: ComponentProps<Theme>["select"] = undefined;
  export let dropdown: ComponentProps<Theme>["dropdown"] = undefined;
  export let onUpdate: ((detail: { theme: string }) => void) | undefined =
    undefined;
</script>

<Theme
  bind:theme
  {tokens}
  {persist}
  {persistKey}
  {system}
  {systemThemes}
  {render}
  {toggle}
  {select}
  {dropdown}
  on:update={(e) => onUpdate?.(e.detail)}
/>
