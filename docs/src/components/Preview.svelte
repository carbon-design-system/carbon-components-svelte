<script>
  export let code = "";
  export let codeRaw = "";
  export let src = "";
  export let framed = false;

  import { CodeSnippet, Button, InlineLoading } from "carbon-components-svelte";
  import Launch16 from "carbon-icons-svelte/lib/Launch16";
  import copy from "clipboard-copy";
  import { url, beforeUrlChange } from "@sveltech/routify";
  import { theme } from "../store";

  let success = false;

  $beforeUrlChange(() => {
    if (success) success = false;
    return true;
  });
</script>

<style global>
  .preview {
    margin-bottom: var(--cds-layout-04);
    margin-left: -1rem;
    margin-right: -1rem;
    max-width: 56rem;
  }

  .code-override .bx--copy-btn,
  .code-override .bx--snippet,
  .code-override button.bx--btn.bx--snippet-btn--expand {
    background-color: #262626;
    color: #f4f4f4;
  }

  .code-override .bx--copy-btn:hover,
  .code-override button.bx--btn.bx--snippet-btn--expand:hover {
    background-color: #393939;
  }

  .code-override .bx--snippet__icon {
    fill: #f4f4f4;
  }

  .code-override .bx--snippet-container pre {
    font-size: var(--cds-code-02-font-size);
    line-height: var(--cds-code-02-line-height);
    letter-spacing: var(--cds-code-02-letter-spacing);
    cursor: text;
  }

  .code-override .bx--snippet--multi .bx--snippet-container pre {
    overflow-x: auto;
  }

  .token.tag,
  .token.operator {
    color: #6ea6ff;
  }

  .token.attr-name {
    color: #3ddbd9; /* teal 30 */
  }

  .token.token.language-javascript,
  .token.attr-value {
    color: #d4bbff; /* purple 30 */
  }

  .token.keyword {
    color: #bb8eff;
  }

  .token.punctuation {
    color: #a8a8a8; /* gray 40 */
  }

  .token.script .token.language-javascript {
    color: #3ddbd9; /* teal 30 */
  }

  .token.string {
    color: #fa75a6;
  }

  .token.boolean {
    color: #bb8eff;
  }

  .token.comment {
    color: #bebebe;
  }

  .code-override {
    border: 1px solid #262626;
  }

  html[theme="g90"] .code-override {
    border: 1px solid var(--cds-ui-03);
  }

  .preview-viewer {
    border: 1px solid var(--cds-ui-03);
    border-bottom: 0;
    position: relative;
    z-index: 1;
  }

  .preview-viewer:not(.framed) {
    padding: var(--cds-spacing-06) var(--cds-spacing-05);
  }

  .preview-viewer.framed {
    min-height: 20rem;
  }

  .framed-header {
    display: flex;
    align-items: center;
  }

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>

<div class="preview">
  {#if framed}
    <div class="framed-header">
      <div style="margin-left: var(--cds-spacing-03)">
        {#if framed && !success}
          <InlineLoading description="Loading..." />
        {/if}
      </div>
      <Button
        style="margin-left: auto;"
        kind="ghost"
        target="_blank"
        size="field"
        href="{$url(src)}"
        icon="{Launch16}"
      >
        Open in new tab
      </Button>
    </div>
  {/if}
  <div class="preview-viewer" class:framed>
    {#if framed}
      <iframe
        on:load="{() => {
          success = true;
        }}"
        title="{src.split('/').pop()}"
        src="{$url(`${src}?theme=${$theme}`)}"
      ></iframe>
    {:else}
      <slot />
    {/if}
  </div>
  <div class="code-override">
    <CodeSnippet type="multi" on:click="{() => copy(codeRaw)}">
      {@html code}
    </CodeSnippet>
  </div>
</div>
