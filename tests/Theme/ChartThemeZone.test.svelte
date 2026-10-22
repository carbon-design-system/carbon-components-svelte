<script lang="ts">
  import { THEME_ZONE_CONTEXT_KEY } from "carbon-components-svelte/constants/context-keys.js";
  import type { CarbonTheme } from "carbon-components-svelte/Theme/Theme.svelte";
  import { setContext } from "svelte";
  import { readonly, writable } from "svelte/store";

  export let theme: CarbonTheme;

  // Stands in for ThemeZone, which sets its theme as a readable store.
  const zone = writable(theme);

  $: zone.set(theme);

  setContext(THEME_ZONE_CONTEXT_KEY, readonly(zone));
</script>

<slot />
