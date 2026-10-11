<script>
  /**
   * Expandable remote value. Children load one level at a time from the
   * preview iframe; getters run only when clicked.
   */
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";
  import { request } from "../state.js";
  import ValuePreview from "./ValuePreview.svelte";

  /** @type {any} */
  export let value;

  /** @type {string | undefined} */
  export let name = undefined;

  export let expanded = false;

  /** For array range groups: [start, end] of the parent handle. */
  /** @type {[number, number] | undefined} */
  export let range = undefined;

  /** @type {number | undefined} */
  export let groupId = undefined;

  /** @type {any[] | null} */
  let children = null;
  let gone = false;
  let loading = false;

  $: expandable =
    range !== undefined || (value?.t === "object" && value.sub !== "weak");

  async function load() {
    if (children || loading) return;
    loading = true;
    const result = await request({
      type: "props",
      id: range ? groupId : value.id,
      range,
    });
    loading = false;
    gone = !!result.gone;
    children = result.props ?? [];
  }

  $: if (expanded && expandable) load();

  function toggle() {
    expanded = !expanded;
  }

  async function invoke(prop, index) {
    const result = await request({
      type: "getter",
      id: prop.id,
      key: prop.key,
    });
    children[index] = result.gone
      ? { name: prop.name, value: { t: "undefined" } }
      : { name: prop.name, value: result.value, threw: result.threw };
  }
</script>

<span class="node">
  {#if expandable}
    <button
      type="button"
      class="toggle"
      aria-expanded={expanded}
      on:click|stopPropagation={toggle}
    >
      <ChevronRight class="chevron {expanded ? "open" : ""}" size={12} />
      {#if name !== undefined}
        <span class="key">{name}</span>
        {#if !range}
          :
        {/if}
      {/if}
      {#if !range}
        <ValuePreview {value} nested={name !== undefined} />
      {/if}
    </button>
  {:else}
    <span class="leaf">
      {#if name !== undefined}
        <span class="key">{name}</span>:
      {/if}
      <ValuePreview {value} nested={name !== undefined} />
    </span>
  {/if}

  {#if expanded && expandable}
    <ul class="children" role="group">
      {#if loading && !children}
        <li class="muted">Loading…</li>
      {:else if gone}
        <li class="muted">Value from an earlier run is no longer available</li>
      {:else if children}
        {#each children as prop, index (prop.name + index)}
          <li>
            {#if prop.group}
              <svelte:self
                name={prop.name}
                range={prop.range}
                groupId={prop.id}
              />
            {:else if prop.getter}
              <span class="key">{prop.name}</span>:
              <button
                type="button"
                class="getter"
                title="Invoke property getter"
                on:click|stopPropagation={() => invoke(prop, index)}
              >
                (…)
              </button>
            {:else if prop.entry}
              <span class="entry"
                ><svelte:self value={prop.entry[0]} />
                =&gt; <svelte:self value={prop.entry[1]} /></span
              >
            {:else}
              <span class:internal={prop.internal}
                ><svelte:self name={prop.name} value={prop.value} /></span
              >
              {#if prop.threw}
                <span class="muted"> (threw)</span>
              {/if}
            {/if}
          </li>
        {:else}
          <li class="muted">No properties</li>
        {/each}
      {/if}
    </ul>
  {/if}
</span>

<style>
  .node {
    display: inline;
  }

  .toggle,
  .getter {
    display: inline;
    padding: 0;
    border: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    background: none;
    cursor: pointer;
  }

  .toggle:focus-visible,
  .getter:focus-visible {
    outline: 2px solid var(--cds-focus, #0f62fe);
    outline-offset: 1px;
  }

  .toggle :global(.chevron) {
    vertical-align: -1px;
    margin-right: 0.125rem;
    transition: transform 70ms;
  }

  .toggle :global(.chevron.open) {
    transform: rotate(90deg);
  }

  .children {
    margin: 0;
    padding-left: 1rem;
    list-style: none;
  }

  .key {
    color: var(--cds-syntax-property-name, #9f1853);
  }

  .internal :global(.key) {
    color: var(--cds-text-03, #8d8d8d);
  }

  .getter {
    color: var(--cds-link-01, #0f62fe);
  }

  .muted {
    color: var(--cds-text-03, #8d8d8d);
  }
</style>
