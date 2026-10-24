<script>
  import {
    InterstitialScreen,
    InterstitialScreenBody,
    InterstitialScreenFooter,
    InterstitialScreenHeader,
    InterstitialScreenView,
  } from "carbon-components-svelte";

  const isFullScreen = new URLSearchParams(location.search).has("fullScreen");
</script>

<InterstitialScreen open {isFullScreen} data-testid="screen">
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
    <InterstitialScreenView stepTitle="Invite">
      <p>Add the people who share this workspace.</p>
    </InterstitialScreenView>
  </InterstitialScreenBody>
  <InterstitialScreenFooter />
</InterstitialScreen>
