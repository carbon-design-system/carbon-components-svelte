<script lang="ts">
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
  import InterstitialScreenView from "carbon-components-svelte/InterstitialScreen/InterstitialScreenView.svelte";
</script>

<InterstitialScreen open id="intro">
  <InterstitialScreenBody>
    <InterstitialScreenView stepTitle="One">Step one</InterstitialScreenView>
  </InterstitialScreenBody>
</InterstitialScreen>
