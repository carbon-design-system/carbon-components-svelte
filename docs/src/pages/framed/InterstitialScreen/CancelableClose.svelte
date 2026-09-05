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

  function handleClose(event) {
    if (!confirm("Skip the tour?")) {
      event.preventDefault();
    }
  }
</script>

<Button on:click={() => (open = true)}>Start tour</Button>

<InterstitialScreen bind:open on:close={handleClose}>
  <InterstitialScreenHeader title="Quick tour" />
  <InterstitialScreenBody>
    <InterstitialScreenView>
      <p>Press Escape, Skip, or Get Started to see the confirmation.</p>
    </InterstitialScreenView>
  </InterstitialScreenBody>
  <InterstitialScreenFooter />
</InterstitialScreen>
