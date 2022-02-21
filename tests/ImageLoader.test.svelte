<script lang="ts">
  import { ImageLoader } from "../types";

  let loading = false;
  let loaded = false;
  let error = false;
</script>

<ImageLoader
  bind:loading
  bind:loaded
  bind:error
  fadeIn
  ratio="16x9"
  src=""
  on:load="{(e) => {
    console.log(e.detail); // null
  }}"
  on:error="{(e) => {
    console.log(e.detail); // null
  }}"
/>
