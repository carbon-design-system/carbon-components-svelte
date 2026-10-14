<script lang="ts">
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
</script>

<span id="extra-help">Extra help</span>
<span id="ext-label">External label</span>

<InterstitialScreen open {...$$restProps}>
  <InterstitialScreenBody>Body</InterstitialScreenBody>
</InterstitialScreen>
