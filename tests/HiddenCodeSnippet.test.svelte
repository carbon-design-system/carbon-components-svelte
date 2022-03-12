<script lang="ts">
  import { CodeSnippet } from "../types";

  let toggled = false;

  const code = Array.from({ length: 20 }, (_, i) => i + 1).join("\n");
</script>

{#if toggled}
  <h5>"Show more" will not render</h5>
  <br />
{/if}
<div class:hidden="{!toggled}">
  <CodeSnippet type="multi" code="{code}" />
</div>

{#if toggled}
  <br /><br />
  <h5>"Show more" will render</h5>
  <br />
  <div class:hidden="{!toggled}">
    <CodeSnippet type="multi" code="{code}" />
  </div>
{/if}

<style>
  .hidden {
    display: none;
  }
</style>
