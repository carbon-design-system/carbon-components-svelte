<script>
  import { Dropdown } from "carbon-components-svelte";

  // Filler words, appended to a label to push it onto more lines at the narrow
  // field below. Three classes, so the list holds options of three visibly
  // different heights: the case where no single `itemHeight` is right. The
  // exact line count each produces is neither asserted nor relied on: only
  // that the three differ.
  const FILLER = "wrapping";
  const FILLER_WORDS = [0, 6, 14];

  function label(prefix, index) {
    const words = FILLER_WORDS[index % FILLER_WORDS.length];
    return [prefix, ...Array.from({ length: words }, () => FILLER)].join(" ");
  }

  // Above the default virtualization threshold, so the menu is windowed and
  // every offset has to come from somewhere.
  const items = Array.from({ length: 300 }, (_, i) => ({
    id: i,
    text: label(`Item ${i + 1}`, i),
  }));

  let selectedId = null;
</script>

<!-- `wrapOptions` is the whole of the opt-in: wrapping is what leaves the
     options unequal in height, and what puts the windowed list onto measured
     offsets. There is no second switch, and the stylesheet it brings releases
     the fixed option height without the fixture overriding anything. -->
<div class="field">
  <Dropdown
    labelText="Items"
    {items}
    bind:selectedId
    portalMenu={false}
    wrapOptions
    virtualize={{ containerHeight: 300 }}
  />
</div>

<style>
  /* Narrow enough that a label wraps at all, and fixed so the heights do not
     move with the viewport the test happens to run at. */
  .field {
    inline-size: 320px;
  }
</style>
