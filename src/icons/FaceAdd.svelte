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
    d="M16,22a6,6,0,0,1-5.14-2.92l-1.71,1a8,8,0,0,0,13.7,0l-1.71-1A6,6,0,0,1,16,22Z"
  ></path>
  <path d="M30 4 26 4 26 0 24 0 24 4 20 4 20 6 24 6 24 10 26 10 26 6 30 6 30 4z"
  ></path>
  <path d="M11.5,11A2.5,2.5,0,1,0,14,13.5,2.48,2.48,0,0,0,11.5,11Z"></path>
  <path d="M20.5,11A2.5,2.5,0,1,0,23,13.5,2.48,2.48,0,0,0,20.5,11Z"></path>
  <path
    d="M27.61,13A12.33,12.33,0,0,1,28,16,12,12,0,1,1,16,4V2A14,14,0,1,0,29.67,13Z"
  ></path>
</svg>
