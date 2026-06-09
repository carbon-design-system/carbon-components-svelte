<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";

  export let tick = 0;
</script>

{tick}

<InlineLoading
  status="finished"
  description="Success"
  on:success={() => {
    console.log("success");
  }}
/>
