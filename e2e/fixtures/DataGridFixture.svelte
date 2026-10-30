<script>
  import { DataGrid } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const rowCount = Number(params.get("rows") ?? 40);
  const columnCount = Number(params.get("columns") ?? 12);
  const frozenRows = Number(params.get("frozenRows") ?? 0);
  const frozenColumns = Number(params.get("frozenColumns") ?? 0);
  const size = params.get("size") ?? "short";
  const height = Number(params.get("height") ?? 320);

  const dir = params.get("dir");
  if (dir) document.documentElement.dir = dir;
  if (params.get("theme") === "g100") {
    document.documentElement.classList.add("bx--g100");
  }

  const columns = Array.from({ length: columnCount }, (_, c) => ({
    key: `c${c}`,
    title: c === 0 ? "Item" : `Column ${c}`,
    width: c === 0 ? 160 : 120 + (c % 3) * 20,
    align: c === 0 ? "start" : "end",
  }));

  let rows = Array.from({ length: rowCount }, (_, r) => {
    const row = {};
    for (let c = 0; c < columnCount; c++) {
      row[`c${c}`] = c === 0 ? `Item ${r + 1}` : r * 100 + c;
    }
    return row;
  });

  // Fields a spreadsheet has to quote.
  if (rowCount > 3 && columnCount > 3) {
    rows[1].c1 = 'He said "hi"';
    rows[1].c2 = "two\nlines";
    rows[2].c1 = "a\tb";
    // Values that read differently reversed.
    rows[3].c1 = "-4.2";
    rows[3].c2 = "3 / 4";
  }

  let activeCell = { row: 0, column: 0 };
  let selection = null;
  let pasteLog = "";
  let cancelPaste = false;

  function handlePaste(event) {
    const { matrix, range, truncated } = event.detail;
    pasteLog = JSON.stringify({ matrix, range, truncated });
    if (cancelPaste) {
      event.preventDefault();
      return;
    }
    // The grid never edits a row: the consumer writes the values.
    const next = rows.slice();
    matrix.forEach((line, i) => {
      const r = range.startRow + i;
      if (r > range.endRow) return;
      next[r] = { ...next[r] };
      line.forEach((value, j) => {
        const c = range.startColumn + j;
        if (c > range.endColumn) return;
        next[r][`c${c}`] = value;
      });
    });
    rows = next;
  }
</script>

<div style="padding: 1rem;">
  <label>
    <input
      type="checkbox"
      data-testid="cancel-paste"
      bind:checked={cancelPaste}
    />
    Cancel paste
  </label>
  <button type="button" data-testid="before">Before</button>
  <DataGrid
    {columns}
    {rows}
    {frozenRows}
    {frozenColumns}
    {size}
    {height}
    labelText="Sales"
    data-testid="grid"
    bind:activeCell
    bind:selection
    on:paste={handlePaste}
  />
  <button type="button" data-testid="after">After</button>
  <pre data-testid="state">{JSON.stringify({ activeCell, selection })}</pre>
  <pre data-testid="paste-log">{pasteLog}</pre>
</div>
