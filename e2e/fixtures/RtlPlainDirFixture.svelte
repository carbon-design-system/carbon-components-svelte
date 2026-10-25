<script>
  import {
    LayoutDirection,
    PinCodeInput,
    Slider,
    Tab,
    Tabs,
  } from "carbon-components-svelte";
</script>

<!-- A plain `dir` inside a LayoutDirection, each way round. -->
{#each [
  ["rtl", "ltr"],
  ["ltr", "rtl"],
] as [outer, inner] (outer)}
  <LayoutDirection dir={outer}>
    <div data-testid="plain-{inner}" dir={inner}>
      <PinCodeInput labelText="Verification code ({inner})" />
      <Slider labelText="Replicas ({inner})" value={20} />
      <Tabs>
        <Tab label="Overview ({inner})" />
        <Tab label="Logs ({inner})" />
        <Tab label="Settings ({inner})" />
      </Tabs>
    </div>
  </LayoutDirection>
{/each}
