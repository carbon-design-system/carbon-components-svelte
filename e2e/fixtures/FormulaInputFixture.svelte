<script>
  import { FormulaInput } from "carbon-components-svelte";
  import { onMount } from "svelte";

  /** @type {import("carbon-components-svelte/FormulaInput/formula-check.js").FormulaField[]} */
  const fields = [
    { id: "price", label: "Unit price", type: "number" },
    { id: "cost", label: "Unit cost", type: "number" },
    { id: "qty", label: "Quantity", type: "number" },
    { id: "status", label: "Status", type: "string" },
    { id: "revenue", label: "הכנסות", type: "number" },
    { id: "net revenue", label: "Net revenue", type: "number" },
  ];

  const row = {
    price: 100,
    cost: 40,
    qty: 3,
    status: "open",
    revenue: 500,
    "net revenue": 320,
  };

  let value = 'IF(status = "open", price * 1.2, ROUND(price, 2))';
  let diagnostics = [];
  let result;
  /** @type {null | HTMLTextAreaElement} */
  let ref = null;
  let invalid = false;
  let disabled = false;
  let readonly = false;
  let fluid = false;
  let maxRows = 6;

  onMount(() => {
    window.__formula = {
      setValue(next) {
        value = next;
      },
      setProps(props) {
        if ("invalid" in props) invalid = props.invalid;
        if ("disabled" in props) disabled = props.disabled;
        if ("readonly" in props) readonly = props.readonly;
        if ("fluid" in props) fluid = props.fluid;
        if ("maxRows" in props) maxRows = props.maxRows;
      },
    };
  });
</script>

<div data-testid="host" style="max-width: 36rem; padding: 1rem">
  <FormulaInput
    bind:ref
    bind:value
    bind:diagnostics
    bind:result
    {fields}
    {row}
    {invalid}
    {disabled}
    {readonly}
    {fluid}
    {maxRows}
    invalidText={invalid ? "Not allowed" : ""}
    labelText="Calculated price"
    helperText="Use field names in braces or by id"
    placeholder="Type a formula"
    name="formula"
  />
  <output data-testid="value">{value}</output>
  <output data-testid="errors">{diagnostics.length}</output>
  <output data-testid="result"
    >{result
      ? result.ok
        ? String(result.value)
        : result.error.code
      : ""}</output
  >
</div>
