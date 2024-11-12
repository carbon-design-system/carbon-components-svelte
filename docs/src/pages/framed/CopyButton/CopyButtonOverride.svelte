<script>
  import copy from "clipboard-copy";
  import { CopyButton } from "carbon-components-svelte";
</script>

<CopyButton text="Carbon svelte" copy={(text) => copy(text)} />
