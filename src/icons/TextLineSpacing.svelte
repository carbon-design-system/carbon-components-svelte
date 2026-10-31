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
  <path d="M17 6H30V8H17z"></path>
  <path d="M17 12H27V14H17z"></path>
  <path d="M17 18H30V20H17z"></path>
  <path d="M17 24H27V26H17z"></path>
  <path d="M11.59 13.41 8 9.83 8 9.83 4.41 13.42 3 12 8 7 13 12 11.59 13.41z"
  ></path>
  <path d="M11.59 18.59 8 22.17 8 22.17 4.41 18.58 3 20 8 25 13 20 11.59 18.59z"
  ></path>
</svg>
