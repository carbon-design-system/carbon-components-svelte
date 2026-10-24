<script>
  import { Select, SelectItem } from "carbon-components-svelte";
</script>

{#each [
  { invalid: true, invalidText: "Add more seats." },
  { warn: true, warnText: "Ends next month." },
] as status, i (i)}
  <div data-status={status.invalid ? "invalid" : "warn"}>
    <Select inline labelText="Account plan" selected="enterprise" {...status}>
      <SelectItem value="starter" text="Starter" />
      <SelectItem value="enterprise" text="Enterprise" />
    </Select>
  </div>
{/each}
