<script>
  import FloatingPortal from "./FloatingPortal.svelte";

  export let anchor = null;
  export let direction = "top";
  export let open = false;
  export let text = "";
</script>

<FloatingPortal {anchor} {direction} {open} intrinsicWidth={true}>
  <div class="bx--tooltip-portal" data-direction={direction}>
    <span class="bx--tooltip-portal__caret"></span>
    <span class="bx--tooltip-portal__content">{text}</span>
  </div>
</FloatingPortal>
