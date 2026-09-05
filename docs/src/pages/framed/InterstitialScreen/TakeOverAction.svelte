<script>
  import {
    Button,
    Checkbox,
    InterstitialScreen,
    InterstitialScreenBody,
    InterstitialScreenFooter,
    InterstitialScreenHeader,
    InterstitialScreenView,
  } from "carbon-components-svelte";

  let open = false;
  let acknowledged = false;

  function handleAction(event) {
    if (event.detail.actionType === "next" && !acknowledged) {
      event.preventDefault();
    }
  }
</script>

<Button on:click={() => (open = true)}>Start tour</Button>

<InterstitialScreen bind:open>
  <InterstitialScreenHeader title="Terms" />
  <InterstitialScreenBody>
    <InterstitialScreenView stepTitle="Review">
      <Checkbox labelText="I have read the terms" bind:checked={acknowledged} />
    </InterstitialScreenView>
    <InterstitialScreenView stepTitle="Confirm">
      <p>You're all set.</p>
    </InterstitialScreenView>
  </InterstitialScreenBody>
  <InterstitialScreenFooter on:action={handleAction} />
</InterstitialScreen>
