<script>
  import { SignaturePad } from "carbon-components-svelte";

  let value = null;
  $: if (typeof window !== "undefined") window.__signature = value;
</script>

<!-- A page taller than the screen: a finger in the pad draws, a finger on the
     rest of the page scrolls it. -->
<div data-testid="above" style="height: 480px">Delivery details</div>
<SignaturePad bind:value labelText="Recipient signature" aspectRatio={2} />
<div data-testid="below" style="height: 900px">Terms</div>
