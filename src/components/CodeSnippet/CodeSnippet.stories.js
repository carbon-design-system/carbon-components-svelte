import { withKnobs, boolean, text } from "@storybook/addon-knobs";
import Component from "./CodeSnippet.Story.svelte";

export default { title: "CodeSnippet", decorators: [withKnobs] };

export const Inline = () => ({
  Component,
  props: {
    story: "inline",
    light: boolean("Light variant (light)", false),
    feedback: text("Feedback text (feedback)", "Feedback Enabled 👍"),
    copyLabel: text(
      "ARIA label for the snippet/copy button (copyLabel)",
      "copyable code snippet"
    ),
  },
});

export const SingleLine = () => ({
  Component,
  props: {
    story: "single line",
    light: boolean("Light variant (light)", false),
    feedback: text("Feedback text (feedback)", "Feedback Enabled 👍"),
    copyButtonDescription: text(
      "Copy icon description (copyButtonDescription)",
      "copyable code snippet"
    ),
    "aria-label": text(
      "ARIA label of the container (ariaLabel)",
      "Container label"
    ),
  },
});

export const MultiLine = () => ({
  Component,
  props: {
    story: "multi line",
    feedback: text("Feedback text (feedback)", "Feedback Enabled 👍"),
    showMoreText: text(
      'Text for "show more" button (showMoreText)',
      "Show more"
    ),
    showLessText: text(
      'Text for "show less" button (showLessText)',
      "Show less"
    ),
  },
});

export const Skeleton = () => ({ Component, props: { story: "skeleton" } });
