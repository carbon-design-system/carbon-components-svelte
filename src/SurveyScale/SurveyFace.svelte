<script>
  /**
   * Specify the face, from `1` (very dissatisfied) to `5` (very satisfied).
   * @type {number}
   */
  export let level = 3;

  /** Specify the size in pixels */
  export let size = 24;

  // Each shape sets its own `fill`: forced colors paint every `svg` fill
  // `ButtonText`, which would fill the outline and the mouth.
  // The mouth bends from a frown to a smile; the eyes stay put.
  const MOUTHS = [
    "M10 23 Q16 16.5 22 23",
    "M10.5 22 Q16 18.5 21.5 22",
    "M11 21.5 L21 21.5",
    "M10.5 20 Q16 23.5 21.5 20",
    "M9.5 19 Q16 27 22.5 19",
  ];

  $: mouth = MOUTHS[Math.min(5, Math.max(1, Math.round(level))) - 1];
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  preserveAspectRatio="xMidYMid meet"
  width={size}
  height={size}
  aria-hidden="true"
  focusable="false"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  {...$$restProps}
>
  <circle cx="16" cy="16" r="13" fill="none"></circle>
  <circle cx="11.5" cy="13" r="1.25" fill="currentColor" stroke="none"></circle>
  <circle cx="20.5" cy="13" r="1.25" fill="currentColor" stroke="none"></circle>
  <path d={mouth} fill="none"></path>
</svg>
