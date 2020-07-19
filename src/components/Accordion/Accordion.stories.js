import {
  withKnobs,
  text,
  boolean,
  number,
  select,
} from "@storybook/addon-knobs";
import Component from "./Accordion.Story.svelte";

export default { title: "Accordion", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    align: select(
      "Accordion heading alignment (align)",
      ["start", "end"],
      "end"
    ),
    title: text("The title (title)", "Section 1 title"),
    open: boolean("Open the section (open)", false),
  },
});

export const Skeleton = () => ({
  Component,
  props: {
    story: "skeleton",
    open: boolean("Show first item opened (open)", true),
    count: number("Set number of items (count)", 4),
  },
});
