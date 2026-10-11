<script>
  import CopyButton from "carbon-components-svelte/src/CopyButton/CopyButton.svelte";
  import InlineLoading from "carbon-components-svelte/src/InlineLoading/InlineLoading.svelte";
  import Select from "carbon-components-svelte/src/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/src/Select/SelectItem.svelte";
  import Tag from "carbon-components-svelte/src/Tag/Tag.svelte";
  import Header from "carbon-components-svelte/src/UIShell/Header.svelte";
  import { examples } from "./examples.js";
  import {
    defaultFiles,
    href,
    loadExample,
    metrics,
    setTheme,
    status,
    theme,
  } from "./state.js";

  const THEMES = ["white", "g10", "g80", "g90", "g100"];

  let example = "";
  let selectedTheme = $theme;

  $: if (example) {
    const match = examples.find((e) => e.id === example);
    if (match) loadExample({ ...match, files: match.files ?? defaultFiles() });
    example = "";
  }

  $: setTheme(selectedTheme);
  $: link = $href;
  $: m = $metrics;
  $: state = $status;

  const ms = (value) => (value === undefined ? "—" : `${Math.round(value)} ms`);
</script>

<Header companyName="Carbon" platformName="REPL (spike)" href="/" />

<div class="toolbar">
  <Select inline size="sm" labelText="Example" bind:selected={example}>
    <SelectItem value="" text="Load an example…" />
    {#each examples as e (e.id)}
      <SelectItem value={e.id} text={e.label} />
    {/each}
  </Select>

  <Select
    inline
    size="sm"
    labelText="Preview theme"
    bind:selected={selectedTheme}
  >
    {#each THEMES as t (t)}
      <SelectItem value={t} text={t} />
    {/each}
  </Select>

  <CopyButton text={link} iconDescription="Copy link" feedback="Link copied" />

  <div class="status">
    {#if state === "compiling"}
      <InlineLoading description="Compiling…" />
    {:else if state === "error"}
      <InlineLoading status="error" description="Error" />
    {:else}
      <InlineLoading status="finished" description="Ready" />
    {/if}
  </div>

  <div class="metrics" aria-label="Performance">
    <Tag size="sm" type="cool-gray" title="Navigation → code painted"
      >code {ms(m.codeVisible)}</Tag
    >
    <Tag size="sm" type="cool-gray" title="Navigation → first preview painted"
      >preview {ms(m.previewPainted)}</Tag
    >
    <Tag
      size="sm"
      type="cool-gray"
      title="Compiler download + evaluation in the worker"
      >compiler {ms(m.compilerLoad)}</Tag
    >
    <Tag size="sm" type="blue" title="Last compile in the worker"
      >compile {ms(m.compile)}</Tag
    >
    <Tag
      size="sm"
      type="blue"
      title="Compile request → preview painted (after debounce)"
      >update {ms(m.update)}</Tag
    >
  </div>
</div>

<style>
  .toolbar {
    position: absolute;
    top: 3rem;
    left: 0;
    right: 0;
    height: 3rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem;
    background: var(--cds-ui-01, #f4f4f4);
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
    overflow-x: auto;
  }

  /* Carbon's .bx--form-item grows (flex: 1 1 auto); keep the controls packed. */
  .toolbar > :global(.bx--form-item) {
    flex: none;
  }

  .status {
    min-width: 7rem;
  }

  .metrics {
    margin-left: auto;
    display: flex;
    gap: 0.25rem;
    white-space: nowrap;
  }
</style>
