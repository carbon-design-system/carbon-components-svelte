<script lang="ts">
  import Guidebanner from "carbon-components-svelte/InlineTip/Guidebanner.svelte";
  import InlineTip from "carbon-components-svelte/InlineTip/InlineTip.svelte";
  import { createTipStore } from "../../src/utils/tip-store";

  export let stored: string[] = [];
  export let initial: string[] | undefined = undefined;
  export let pending: "hide" | "show" = "hide";
  export let onRead: () => void = () => {};

  // What the user dismissed before, read only once the page is mounted.
  const store = createTipStore({
    storage: {
      read: () => {
        onRead();
        return stored;
      },
      write() {},
    },
    initial,
    pending,
  });
</script>

<p>Above</p>
<InlineTip id="filters" title="Filter by owner" {store}
  >Narrow the table.</InlineTip
>
<Guidebanner
  {store}
  tips={[
    { id: "export", title: "Export a view" },
    { id: "share", title: "Share a view" },
  ]}
/>
<p>Below</p>
