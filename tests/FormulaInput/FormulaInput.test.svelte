<script lang="ts">
  import FormulaInput from "carbon-components-svelte/FormulaInput/FormulaInput.svelte";
  import type { FormulaDiagnostic } from "carbon-components-svelte/FormulaInput/formula-lang.js";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let fields: ComponentProps<FormulaInput>["fields"] = [
    { id: "price", label: "Unit price", type: "number" },
    { id: "qty", type: "number" },
    { id: "status", type: "string" },
  ];
  export let row: ComponentProps<FormulaInput>["row"] = {
    price: 100,
    qty: 3,
    status: "open",
  };
  export let invalid = false;
  export let invalidText = "";
  export let readonly = false;
  export let disabled = false;
  export let diagnostics: FormulaDiagnostic[] = [];
</script>

<FormulaInput
  labelText="Formula"
  helperText="Helper"
  bind:value
  bind:diagnostics
  {fields}
  {row}
  {invalid}
  {invalidText}
  {readonly}
  {disabled}
/>
<output data-testid="value">{value}</output>
<output data-testid="errors">{diagnostics.length}</output>
