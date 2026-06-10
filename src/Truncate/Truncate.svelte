<script>
  /**
   * Specify `"end"` or `"front"`. `"front"` only works when `lines` is `1`.
   * @type {"end" | "front"}
   */
  export let clamp = "end";

  /**
   * Number of visible lines before truncating. Values above `1` use multiline mode (end clamp only).
   * @type {number}
   */
  export let lines = 1;

  $: multiline = lines > 1;
  $: style = multiline
    ? `--ccs-truncate-lines: ${lines};${
        $$restProps.style ? ` ${$$restProps.style}` : ""
      }`
    : $$restProps.style;
</script>

<p
  class:bx--text-truncate--end={!multiline && clamp === "end"}
  class:bx--text-truncate--front={!multiline && clamp === "front"}
  class:bx--text-truncate--multiline={multiline}
  {...$$restProps}
  {style}
>
  <slot />
</p>
