<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import type { ComponentProps } from "svelte";
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  export let size: ComponentProps<Button>["size"] = undefined;

  setContext("carbon:ActionSet", { size: writable("small") });
</script>

<Button {size}>Save</Button>
