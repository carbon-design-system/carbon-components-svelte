<script>
  export let segment = undefined;

  import { Content } from "carbon-components-svelte";
  import GlobalHeader from "../components/GlobalHeader.svelte";
</script>

{#if segment !== 'examples'}
  <GlobalHeader {segment} />
  <Content>
    <slot />
  </Content>
{:else}
  <slot />
{/if}
