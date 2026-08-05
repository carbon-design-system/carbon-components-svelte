<script lang="ts">
  import PinCodeInputSkeleton from "carbon-components-svelte/PinCodeInput/PinCodeInputSkeleton.svelte";

  export let hideLabel = false;
</script>

<PinCodeInputSkeleton
  data-testid="pin-code-input-skeleton"
  {hideLabel}
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
