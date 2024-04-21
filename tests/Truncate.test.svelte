<script lang="ts">
  import { Truncate, truncate } from "../types";
</script>

<Truncate tag="div" clamp="front" aria-label="">
  Carbon Components Svelte is a Svelte component library.
</Truncate>

<div use:truncate></div>
<div use:truncate="{{ clamp: 'front' }}"></div>
