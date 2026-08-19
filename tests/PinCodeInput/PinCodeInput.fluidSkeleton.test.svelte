<script lang="ts">
  import FluidPinCodeInputSkeleton from "carbon-components-svelte/PinCodeInput/FluidPinCodeInputSkeleton.svelte";
</script>

<FluidPinCodeInputSkeleton
  data-testid="fluid-pin-code-input-skeleton"
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
/>
