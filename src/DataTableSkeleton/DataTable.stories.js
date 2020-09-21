import { withKnobs, array, boolean, number } from "@storybook/addon-knobs";
import Component from "./DataTableSkeleton.Story.svelte";

export default { title: "DataTableSkeleton", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    columns: number("Number of columns", 5),
    rows: number("Number of rows", 5),
    zebra: boolean("Use zebra stripe (zebra)", false),
    compact: boolean("Compact variant (compact)", false),
    showHeader: boolean("Show header", true),
    headers: array(
      "Optional table headers (headers)",
      ["Name", "Protocol", "Port", "Rule", "Attached Groups"],
      ","
    ),
    showToolbar: boolean("Show toolbar", true),
  },
});
