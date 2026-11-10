<script lang="ts">
  import FormulaInput from "carbon-components-svelte/FormulaInput/FormulaInput.svelte";
</script>

<FormulaInput
  value="ROUND(price, 2) + FOO(1)"
  labelText="Formula"
  fields={[{ id: "price", type: "number" }]}
  row={{ price: 1 }}
/>
