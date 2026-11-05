<script lang="ts">
  import LocaleProvider from "carbon-components-svelte/LocaleProvider/LocaleProvider.svelte";
  import type { ComponentProps } from "svelte";
  import Probe from "./Probe.test.svelte";

  export let provider: ComponentProps<LocaleProvider> | undefined = undefined;
  export let nested: ComponentProps<LocaleProvider> | undefined = undefined;
  export let outside = false;
</script>

{#if outside}
  <Probe id="outside" />
{/if}

<LocaleProvider {...provider} data-testid="wrapper-outer">
  <Probe id="outer" />
  {#if nested}
    <LocaleProvider {...nested} data-testid="wrapper-inner">
      <Probe id="inner" />
    </LocaleProvider>
  {/if}
</LocaleProvider>
