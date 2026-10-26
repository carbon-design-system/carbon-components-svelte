<script lang="ts">
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
  import InterstitialScreenView from "carbon-components-svelte/InterstitialScreen/InterstitialScreenView.svelte";
</script>

<InterstitialScreen open isFullScreen>
  <InterstitialScreenBody>
    <InterstitialScreenView stepTitle="One">Step one</InterstitialScreenView>
    <InterstitialScreenView stepTitle="Two">Step two</InterstitialScreenView>
    <InterstitialScreenView stepTitle="Three">Step three</InterstitialScreenView
    >
  </InterstitialScreenBody>
</InterstitialScreen>
