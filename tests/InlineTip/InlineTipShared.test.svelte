<script lang="ts">
  import InlineTip from "carbon-components-svelte/InlineTip/InlineTip.svelte";
  import { createTipStore, setTipStore } from "../../src/utils/tip-store";

  const store = createTipStore();
  setTipStore(store);
</script>

<InlineTip id="a" title="Tip A">A</InlineTip>
<InlineTip id="b" title="Tip B">B</InlineTip>
<button type="button" on:click={() => store.reset()}>Show tips again</button>
