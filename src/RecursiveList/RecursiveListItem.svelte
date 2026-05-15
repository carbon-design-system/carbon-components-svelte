<script>
  /** Specify the text to render*/
  export let text = "";

  /** Specify a link href */
  export let href = "";

  /** Specify HTML to render using `@html` */
  export let html = "";

  /**
   * Specify the link target.
   * @type {import("svelte/elements").HTMLAnchorAttributes["target"]}
   */
  export let target = undefined;

  /**
   * Specify the link rel. When `target` is `"_blank"`,
   * `rel` defaults to `"noopener noreferrer"`.
   * @type {import("svelte/elements").HTMLAnchorAttributes["rel"]}
   */
  export let rel = undefined;

  import ListItem from "../ListItem/ListItem.svelte";
</script>

<ListItem>
  {#if text && !href}
    {text}
  {/if}
  {#if href}
    <a
      class:bx--link={true}
      {href}
      {target}
      rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
    >
      {text || href}
    </a>
  {/if}
  {#if !text && html}
    {@html html}
  {/if}
  <slot />
</ListItem>
