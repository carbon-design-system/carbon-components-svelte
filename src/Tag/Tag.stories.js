import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import Component from "./Tag.Story.svelte";

export default { title: "Tag", decorators: [withKnobs] };

const TYPES = {
  red: "Red",
  magenta: "Magenta",
  purple: "Purple",
  blue: "Blue",
  cyan: "Cyan",
  teal: "Teal",
  green: "Green",
  gray: "Gray",
  "cool-gray": "Cool-Gray",
  "warm-gray": "Warm-Gray",
  "high-contrast": "High-Contrast",
};

export const Default = () => ({
  Component,
  props: {
    type: select(
      "Tag type (type)",
      Object.keys(TYPES).reduce(
        (items, item) => ({ ...items, [`${item} (${item})`]: item }),
        {}
      ),
      "red"
    ),
    disabled: boolean("Disabled (disabled)", false),
    slot: text("Content ($$slot)", "This is a tag"),
  },
});

export const Filter = () => ({
  Component,
  props: {
    story: "filter",
    filter: true,
    type: select(
      "Tag type (type)",
      Object.keys(TYPES).reduce(
        (items, item) => ({ ...items, [`${item} (${item})`]: item }),
        {}
      ),
      "red"
    ),
    disabled: boolean("Disabled (disabled)", false),
    slot: text("Content ($$slot)", "This is a tag"),
  },
});

export const Skeleton = () => ({ Component, props: { story: "skeleton" } });
