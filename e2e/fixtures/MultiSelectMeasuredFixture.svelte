<script>
  import { MultiSelect } from "carbon-components-svelte";

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
  const items = [
    // Counted and measured with the rest, but not an item any filter has to
    // match: it is always in the menu. Its label wraps too.
    {
      id: "all",
      text: label("Select all", 1),
      isSelectAll: true,
    },
    ...Array.from({ length: 300 }, (_, i) => ({
      id: i,
      // The tag is what the tests filter on; half the list matches each one.
      text: label(`${(i + 1) % 2 === 0 ? "Even" : "Odd"} item ${i + 1}`, i),
    })),
  ];

  let selectedIds = [];
</script>

<!-- `wrapOptions` is the whole of the opt-in: wrapping is what leaves the
     options unequal in height, and what puts the windowed list onto measured
     offsets. There is no second switch, and the stylesheet it brings releases
     both the fixed option height and the one-line checkbox label without the
     fixture overriding anything. -->
<div class="field">
  <MultiSelect
    labelText="Items"
    label="Items"
    placeholder="Filter…"
    {items}
    bind:selectedIds
    filterable
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
