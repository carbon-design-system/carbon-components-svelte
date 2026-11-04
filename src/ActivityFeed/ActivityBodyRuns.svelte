<script>
  /**
   * Internal. The inline runs of one block of an `ActivityBody`.
   */

  /**
   * @type {ReadonlyArray<import("./activity-body.js").ActivityBodyRun>}
   */
  export let runs = [];
</script>

{#each runs as run, index (index)}{#if run.type === "text"}{#if run.strong && run.em}<strong
        ><em>{run.text}</em></strong
      >{:else if run.strong}<strong>{run.text}</strong>{:else if run.em}<em
        >{run.text}</em
      >{:else}{run.text}{/if}{:else if run.type === "code"}<code
      class:bx--activity-body__code={true}>{run.text}</code
    >{:else if run.type === "link"}<a
      class:bx--link={true}
      href={run.href}
      rel="noopener noreferrer ugc"
      target="_blank">{run.text}</a
    >{:else if run.type === "mention"}<bdi
      class:bx--activity-body__mention={true}>{run.trigger}{run.text}</bdi
    >{:else if run.type === "br"}<br />{/if}{/each}
