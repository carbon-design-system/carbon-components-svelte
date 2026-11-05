<script lang="ts">
  import { getLayoutDirection } from "carbon-components-svelte/utils/layout-direction.js";
  import { getLocaleContext } from "carbon-components-svelte/utils/locale-context.js";
  import { getContext } from "svelte";

  export let id: string;

  const context = getLocaleContext();
  const direction = getLayoutDirection();
  // The context `setTranslateContext` sets, once it lands.
  const translate: undefined | ((id: string) => string | undefined) =
    getContext("carbon:translate");
</script>

<output data-testid={id} data-translated={translate?.("greeting")}
  >{JSON.stringify({ ...$context, dir: $direction })}</output
>
