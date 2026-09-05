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
  let loadingAction = "";

  async function handleAction(event) {
    if (event.detail.actionType !== "start") return;
    event.preventDefault();
    loadingAction = "start";
    await new Promise((resolve) => setTimeout(resolve, 1500));
    loadingAction = "";
    open = false;
  }
</script>

<Button on:click={() => (open = true)}>Finish setup</Button>

<InterstitialScreen bind:open>
  <InterstitialScreenHeader title="Finish setup" />
  <InterstitialScreenBody>
    <InterstitialScreenView>
      <p>Get Started saves your preferences before closing.</p>
    </InterstitialScreenView>
  </InterstitialScreenBody>
  <InterstitialScreenFooter bind:loadingAction on:action={handleAction} />
</InterstitialScreen>
