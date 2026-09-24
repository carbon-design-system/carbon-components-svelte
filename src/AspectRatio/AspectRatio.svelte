<script>
  /**
   * Specify the aspect ratio.
   * @type {"2x1"
   *   | "2x3"
   *   | "16x9"
   *   | "4x3"
   *   | "1x1"
   *   | "3x4"
   *   | "3x2"
   *   | "9x16"
   *   | "1x2"}
   */
  export let ratio = "2x1";

  /**
   * Set to `true` to stretch the slotted content to fill the aspect box
   */
  export let fill = false;

  /**
   * Align the slotted content along the cross axis. Makes the aspect
   * box a flex container.
   * @type {"start" | "center" | "end" | undefined}
   */
  export let align = undefined;

  /**
   * Justify the slotted content along the main axis. Makes the aspect
   * box a flex container.
   * @type {"start" | "center" | "end" | undefined}
   */
  export let justify = undefined;
</script>

<div
  class:bx--aspect-ratio={true}
  class:bx--aspect-ratio--2x1={ratio === "2x1"}
  class:bx--aspect-ratio--2x3={ratio === "2x3"}
  class:bx--aspect-ratio--16x9={ratio === "16x9"}
  class:bx--aspect-ratio--4x3={ratio === "4x3"}
  class:bx--aspect-ratio--1x1={ratio === "1x1"}
  class:bx--aspect-ratio--3x4={ratio === "3x4"}
  class:bx--aspect-ratio--3x2={ratio === "3x2"}
  class:bx--aspect-ratio--9x16={ratio === "9x16"}
  class:bx--aspect-ratio--1x2={ratio === "1x2"}
  {...$$restProps}
>
  <div
    class:bx--aspect-ratio--object={true}
    class:bx--aspect-ratio--fill={fill}
    class:bx--aspect-ratio--align-start={align === "start"}
    class:bx--aspect-ratio--align-center={align === "center"}
    class:bx--aspect-ratio--align-end={align === "end"}
    class:bx--aspect-ratio--justify-start={justify === "start"}
    class:bx--aspect-ratio--justify-center={justify === "center"}
    class:bx--aspect-ratio--justify-end={justify === "end"}
  >
    <slot />
  </div>
</div>
