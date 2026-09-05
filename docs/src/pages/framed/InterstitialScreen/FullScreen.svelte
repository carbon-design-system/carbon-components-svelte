<script>
  import {
    Button,
    InterstitialScreen,
    InterstitialScreenBody,
    InterstitialScreenFooter,
    InterstitialScreenHeader,
    InterstitialScreenView,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open full screen</Button>

<InterstitialScreen bind:open isFullScreen>
  <InterstitialScreenHeader
    title="Set up your workspace"
    subTitle="This takes about two minutes."
  />
  <InterstitialScreenBody>
    <InterstitialScreenView stepTitle="Connect">
      <p>Link a data source to get started.</p>
    </InterstitialScreenView>
    <InterstitialScreenView stepTitle="Configure">
      <p>Choose how often your data refreshes.</p>
    </InterstitialScreenView>
  </InterstitialScreenBody>
  <InterstitialScreenFooter />
</InterstitialScreen>
