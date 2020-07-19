import { withKnobs, select, boolean, number } from "@storybook/addon-knobs";
import Component from "./SkeletonText.Story.svelte";

export default { title: "SkeletonText", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    heading: boolean("Skeleton text at a larger size (heading)"),
    paragraph: boolean("Use multiple lines of text (paragraph)"),
    lines: number("The number of lines in a paragraph (lines)", 3),
    width: select(
      "Width (in px or %) of single line of text or max-width of paragraph lines (width)",
      { "100%": "100%", "250px": "250px" },
      "100%"
    ),
  },
});
