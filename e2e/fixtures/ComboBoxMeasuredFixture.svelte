<script>
  import { ComboBox } from "carbon-components-svelte";

  // Filler words, appended to a label to push it onto more lines at the narrow
  // field below. Three classes, so the list holds options of three visibly
  // different heights: the case where no single `itemHeight` is right. The
  // cycle is three long and the tags alternate, so a filtered set holds all
  // three heights in a different order from the unfiltered list.
  const FILLER = "wrapping";
  const FILLER_WORDS = [0, 6, 14];

  function label(prefix, index) {
    const words = FILLER_WORDS[index % FILLER_WORDS.length];
    return [prefix, ...Array.from({ length: words }, () => FILLER)].join(" ");
  }

  // Above the default virtualization threshold both unfiltered and filtered by
  // either tag, so the menu is windowed on both sides of a keystroke and every
  // offset has to come from somewhere.
  const items = Array.from({ length: 300 }, (_, i) => ({
    id: i,
    // The tag is what the tests filter on; half the list matches each one.
    text: label(`${(i + 1) % 2 === 0 ? "Even" : "Odd"} item ${i + 1}`, i),
  }));

  let selectedId = null;
  let value = "";
</script>

<!-- `wrapOptions` is the whole of the opt-in: wrapping is what leaves the
     options unequal in height, and what puts the windowed filtered list onto
     measured offsets. There is no second switch, and the stylesheet it brings
     releases the fixed option height without the fixture overriding anything. -->
<div class="field">
  <ComboBox
    labelText="Items"
    placeholder="Filter…"
    {items}
    bind:selectedId
    bind:value
    portalMenu={false}
    shouldFilterItem={(item, value) =>
      item.text.toLowerCase().includes(value.toLowerCase())}
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
