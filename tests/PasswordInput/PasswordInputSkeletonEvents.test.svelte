<script lang="ts">
  import PasswordInputSkeleton from "carbon-components-svelte/TextInput/PasswordInputSkeleton.svelte";

  export let hideLabel = false;
</script>

<PasswordInputSkeleton
  data-testid="skeleton"
  {hideLabel}
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
