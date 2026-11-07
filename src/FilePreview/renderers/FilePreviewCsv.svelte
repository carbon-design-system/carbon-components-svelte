<script>
  /**
   * @event {null} ready
   * @event {{ reason: "unsupported" | "unreadable" }} fallback
   */

  /**
   * Specify the file to show.
   * @type {import("../file-preview.js").PreviewFile}
   */
  export let file;

  /**
   * Specify what the renderer is given.
   * @type {import("../file-preview.js").PreviewOptions}
   */
  export let options;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../../Button/Button.svelte";
  import {
    decodeText,
    extensionOf,
    parseCsv,
    readBytes,
  } from "../file-preview.js";

  // Rows added to the table at a time.
  const STEP = 100;

  const dispatch = createEventDispatcher();

  /** @type {string[]} */
  let header = [];
  /** @type {string[][]} */
  let body = [];
  let columns = 0;
  let total = 0;
  let cut = false;
  let encodingNote = "";
  let loaded = false;
  let shown = STEP;
  /** @type {HTMLElement | undefined} */
  let region;

  onMount(() => {
    let alive = true;
    readBytes(file.blob).then(
      (bytes) => {
        if (!alive) return;
        const decoded = decodeText(bytes, file.truncated);
        if (decoded.binary) {
          dispatch("fallback", { reason: "unsupported" });
          return;
        }
        const ext = extensionOf(file.name);
        const parsed = parseCsv(decoded.text, {
          delimiter: ext === "tsv" || ext === "tab" ? "\t" : undefined,
        });
        // A file cut mid-row would show a half row last.
        const rows = file.truncated ? parsed.rows.slice(0, -1) : parsed.rows;
        header = rows[0] ?? [];
        body = rows.slice(1);
        columns = parsed.columns;
        cut = parsed.more || file.truncated;
        total = body.length;
        if (decoded.encoding !== "utf-8") {
          encodingNote = options.texts.encoding(decoded.encoding);
        }
        loaded = true;
        dispatch("ready");
      },
      () => alive && dispatch("fallback", { reason: "unreadable" }),
    );
    return () => {
      alive = false;
    };
  });

  $: visible = body.slice(0, shown);
  $: remaining = body.length - shown > 0;
  $: columnIndexes = Array.from({ length: columns }, (_, index) => index);

  async function showMore() {
    shown += STEP;
    if (shown >= body.length) {
      await tick();
      region?.focus({ preventScroll: true });
    }
  }

  /** @param {string} cell */
  function titleOf(cell) {
    return cell.length > 48 ? cell : undefined;
  }
</script>

{#if loaded}
  <div class:bx--file-preview__text={true}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
      bind:this={region}
      class:bx--file-preview__table={true}
      role="group"
      aria-label={file.name}
      tabindex="0"
    >
      <table
        class:bx--data-table={true}
        class:bx--data-table--sm={true}
        class:bx--data-table--zebra={true}
      >
        <thead>
          <tr>
            {#each columnIndexes as index (index)}
              <th scope="col" dir="auto" title={titleOf(header[index] ?? "")}>
                {header[index] ?? ""}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each visible as row, rowIndex (rowIndex)}
            <tr>
              {#each columnIndexes as index (index)}
                <td dir="auto" title={titleOf(row[index] ?? "")}>
                  {row[index] ?? ""}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if remaining || cut || encodingNote}
      <div class:bx--file-preview__footer={true}>
        {#if remaining || cut}
          <span
            >{options.texts.truncated(
              Math.min(shown, body.length),
              cut ? undefined : total,
              "rows",
            )}</span
          >
        {/if}
        {#if encodingNote}
          <span>{encodingNote}</span>
        {/if}
        {#if remaining}
          <Button kind="ghost" size="sm" on:click={showMore}>
            {options.texts.showMore}
          </Button>
        {/if}
      </div>
    {/if}
  </div>
{/if}
