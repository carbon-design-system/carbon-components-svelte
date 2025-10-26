<script>
  import { CopyButton } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<CopyButton text="Carbon svelte" copy={(text) => copy(text)} />
