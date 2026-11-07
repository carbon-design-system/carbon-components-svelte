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
    d="M28,26H4a2,2,0,0,1-2-2V10A2,2,0,0,1,4,8H28a2,2,0,0,1,2,2V24A2,2,0,0,1,28,26ZM4,10V24H28V10Z"
  ></path>
  <path d="M10 20H21V22H10z"></path>
  <path d="M6 12H8V14H6z"></path>
  <path d="M10 12H12V14H10z"></path>
  <path d="M14 12H16V14H14z"></path>
  <path d="M18 12H20V14H18z"></path>
  <path d="M6 20H8V22H6z"></path>
  <path d="M6 16H8V18H6z"></path>
  <path d="M10 16H12V18H10z"></path>
  <path d="M14 16H16V18H14z"></path>
  <path d="M22 12H26V14H22z"></path>
  <path d="M22 16H26V18H22z"></path>
  <path d="M18 16H20V18H18z"></path>
  <path d="M23 20H26V22H23z"></path>
</svg>
