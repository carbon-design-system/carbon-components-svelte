// @vitest-environment node
import { exampleSource } from "../../docs/scripts/example-source";

describe("exampleSource", () => {
  it("keeps the type imports and declarations a TypeScript example uses", () => {
    const script = `<script lang="ts">
  import { DataTable, Toggle } from "carbon-components-svelte";
  import type { DataTableHeader, DataTableRow } from "carbon-components-svelte";

  type Row = DataTableRow & { name: string };

  let headers: DataTableHeader[] = [];
  let rows: Row[] = [];
</script>`;
    expect(exampleSource("<DataTable {headers} {rows} />", script)).toBe(
      `<script lang="ts">
  import { DataTable } from "carbon-components-svelte";
  import type { DataTableHeader, DataTableRow } from "carbon-components-svelte";

  type Row = DataTableRow & { name: string };
  let headers: DataTableHeader[] = [];
  let rows: Row[] = [];
</script>

<DataTable {headers} {rows} />`,
    );
  });
});
