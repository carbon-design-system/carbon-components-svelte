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

<Button on:click={() => (open = true)}>Start tour</Button>

<InterstitialScreen bind:open>
  <InterstitialScreenHeader title="Product tour" />
  <InterstitialScreenBody>
    <InterstitialScreenView stepTitle="Overview">
      <p>See what's new across the workspace.</p>
    </InterstitialScreenView>
    <InterstitialScreenView stepTitle="Collaborate">
      <p>Invite teammates and share your work in real time.</p>
    </InterstitialScreenView>
    <InterstitialScreenView stepTitle="Automate">
      <p>Set up pipelines that run on a schedule.</p>
    </InterstitialScreenView>
  </InterstitialScreenBody>
  <InterstitialScreenFooter />
</InterstitialScreen>
