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
  let launcherButtonRef = undefined;
</script>

<Button bind:ref={launcherButtonRef} on:click={() => (open = true)}>
  Get started
</Button>

<InterstitialScreen bind:open {launcherButtonRef}>
  <InterstitialScreenHeader
    title="Welcome to Notebooks"
    subTitle="A quick tour before you dive in."
  />
  <InterstitialScreenBody>
    <InterstitialScreenView>
      <p>
        Notebooks let you combine code, visualizations, and narrative text in a
        single document. This tour covers the basics.
      </p>
    </InterstitialScreenView>
  </InterstitialScreenBody>
  <InterstitialScreenFooter />
</InterstitialScreen>
