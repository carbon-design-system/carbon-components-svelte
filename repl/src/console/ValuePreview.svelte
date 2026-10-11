<script>
  /** One-line rendering of a remote preview, colored with Carbon syntax tokens. */

  /** @type {any} */
  export let value;

  /** Quote strings (nested values); top-level log strings print raw. */
  export let nested = false;
</script>

{#if value?.badge}
  <span class="badge">{value.badge}</span>
{/if}
{#if !value}
  <span class="v-undefined">undefined</span>
{:else if value.t === "string"}
  {#if nested}
    <span class="v-string">"{value.v}{value.truncated ? "…" : ""}"</span>
  {:else}
    <span class="v-text">{value.v}{value.truncated ? "…" : ""}</span>
  {/if}
{:else if value.t === "number" || value.t === "bigint"}
  <span class="v-number">{value.v}</span>
{:else if value.t === "boolean"}
  <span class="v-bool">{value.v}</span>
{:else if value.t === "null" || value.t === "undefined"}
  <span class="v-undefined">{value.t}</span>
{:else if value.t === "symbol"}
  <span class="v-symbol">{value.v}</span>
{:else if value.sub === "function"}
  <span class="v-function">{value.desc}</span>
{:else if value.sub === "node"}
  <span class="v-node">{value.desc}</span>
{:else if value.sub === "error"}
  <span class="v-error">{value.desc}</span>
{:else}
  <span class="v-object">{value.desc}</span>
{/if}

<style>
  .badge {
    display: inline-block;
    margin-right: 0.25rem;
    padding: 0 0.25rem;
    border-radius: 2px;
    font-size: 0.625rem;
    line-height: 1rem;
    color: var(--cds-text-04, #fff);
    background: var(--cds-interactive-01, #0f62fe);
    vertical-align: 1px;
  }

  .v-text {
    white-space: pre-wrap;
  }

  .v-string {
    color: var(--cds-syntax-string, #0e6027);
    white-space: pre-wrap;
  }

  .v-number {
    color: var(--cds-syntax-number, #1192e8);
  }

  .v-bool,
  .v-symbol {
    color: var(--cds-syntax-keyword, #8a3ffc);
  }

  .v-undefined {
    color: var(--cds-text-03, #8d8d8d);
  }

  .v-function {
    color: var(--cds-syntax-function, #8a3800);
    font-style: italic;
  }

  .v-node {
    color: var(--cds-syntax-tag-name, #005d5d);
  }

  .v-error {
    color: var(--cds-support-01, #da1e28);
  }
</style>
