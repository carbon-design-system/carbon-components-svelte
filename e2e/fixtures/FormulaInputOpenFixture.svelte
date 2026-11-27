<script>
  import { FormulaInput } from "carbon-components-svelte";
  import { onMount, tick } from "svelte";

  const fields = [
    { id: "price", label: "Unit price", type: "number" },
    { id: "status", label: "Status", type: "string" },
    { id: "stock", label: "Stock level", type: "number" },
    { id: "start date", label: "Start date" },
  ];

  /** @type {null | HTMLTextAreaElement} */
  let ref = null;
  let value = "ROUND(sta";

  // Opens the list and the signature the way typing does, so the sweep sees
  // them open.
  onMount(async () => {
    await tick();
    if (!ref) return;
    ref.focus();
    ref.setSelectionRange(value.length, value.length);
    ref.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
</script>

<div style="max-width: 36rem; padding: 7rem 1rem 14rem">
  <FormulaInput
    bind:ref
    bind:value
    {fields}
    labelText="Calculated price"
    helperText="Type a field or a function"
  />
</div>
