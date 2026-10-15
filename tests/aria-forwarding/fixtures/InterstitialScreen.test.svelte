<script lang="ts">
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
</script>

<InterstitialScreen open {...$$restProps}>
  <InterstitialScreenBody>Welcome</InterstitialScreenBody>
</InterstitialScreen>
