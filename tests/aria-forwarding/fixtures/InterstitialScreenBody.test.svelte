<script lang="ts">
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
  import InterstitialScreenHeader from "carbon-components-svelte/InterstitialScreen/InterstitialScreenHeader.svelte";
</script>

<InterstitialScreen open>
  <InterstitialScreenHeader title="Welcome" />
  <InterstitialScreenBody {...$$restProps}
    >Getting started.</InterstitialScreenBody
  >
</InterstitialScreen>
