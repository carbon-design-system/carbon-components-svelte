<script>
  export let size = 16;

  /**
   * Specify the icon title.
   * @type {string | undefined}
   */
  export let title = undefined;

  $: labelled = $$props["aria-label"] || $$props["aria-labelledby"] || title;
  /**
   * Literal "true", not a boolean: Svelte 3 and 4 write a spread `true` as
   * a bare attribute on the server.
   * @type {{ "aria-hidden": "true" | undefined; role: "img" | undefined; focusable: "true" | undefined }}
   */
  let attributes;
  $: attributes = {
    "aria-hidden": labelled ? undefined : "true",
    role: labelled ? "img" : undefined,
    focusable: Number($$props.tabindex) === 0 ? "true" : undefined,
  };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  fill="currentColor"
  preserveAspectRatio="xMidYMid meet"
  width={size}
  height={size}
  {...attributes}
  {...$$restProps}
>
  {#if title}
    <title>{title}</title>
  {/if}
  <path d="M14 20.18 10.41 16.59 9 18 14 23 23 14 21.59 12.58 14 20.18z"></path>
  <path
    d="M25 5H22V4a2 2 0 00-2-2H12a2 2 0 00-2 2V5H7A2 2 0 005 7V28a2 2 0 002 2H25a2 2 0 002-2V7A2 2 0 0025 5zM12 4h8V8H12zM25 28H7V7h3v3H22V7h3z"
  ></path>
</svg>
