<script>
  /**
   * Inline Markdown runs as text, `code`, `strong`, `em` and links. Not
   * exported.
   */

  /**
   * Specify the runs to draw.
   * @type {import("../markdown-lite.js").MarkdownRun[]}
   */
  export let runs = [];
</script>

{#each runs as run, index (index)}{#if run.href}<a
      href={run.href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      class:bx--link={true}
      >{#if run.code}<code>{run.text}</code>{:else if run.strong}<strong
          >{run.text}</strong
        >{:else if run.em}<em>{run.text}</em>{:else}{run.text}{/if}</a
    >{:else if run.code}<code>{run.text}</code>{:else if run.strong}<strong
      >{run.text}</strong
    >{:else if run.em}<em>{run.text}</em>{:else}{run.text}{/if}{/each}
