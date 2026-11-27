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
  <path
    d="M25 9 25 7 12 7 12 9 17.14 9 12.77 23 7 23 7 25 20 25 20 23 14.86 23 19.23 9 25 9z"
  ></path>
</svg>
