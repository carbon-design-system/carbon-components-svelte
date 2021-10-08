<script>
  /** Specify the text to render*/
  export let text = "";

  /** Specify a link href */
  export let href = "";

  /** Specify HTML to render using `@html` */
  export let html = "";

  import ListItem from "../ListItem/ListItem.svelte";
</script>

<ListItem>
  {#if text && !href}{text}{/if}
  {#if href}<a class:bx--link="{true}" href="{href}">{text || href}</a>{/if}
  {#if !text && html}{@html html}{/if}
  <slot />
</ListItem>
