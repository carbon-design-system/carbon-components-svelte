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
  <!-- Carbon's letter--Aa, scaled to fill the artboard as the arrows do: a
       20-unit cap height with Carbon's 2-unit stroke. -->
  <path d="M13,6H6A2,2,0,0,0,4,8V26H6V17h7v9h2V8A2,2,0,0,0,13,6ZM6,15V8h7v7Z"
  ></path>
  <path
    d="M26,12H19v2h7v4H20a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h8V14A2,2,0,0,0,26,12Zm0,12H20V20h6Z"
  ></path>
</svg>
