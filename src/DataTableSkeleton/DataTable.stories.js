import { withKnobs, array, boolean } from "@storybook/addon-knobs";
import Component from "./DataTableSkeleton.Story.svelte";

export default { title: "DataTableSkeleton", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    headers: array(
      "Optional table headers (headers)",
      ["Name", "Protocol", "Port", "Rule", "Attached Groups"],
      ","
    ),
    zebra: boolean("Use zebra stripe (zebra)", false),
    compact: boolean("Compact variant (compact)", false),
  },
});
