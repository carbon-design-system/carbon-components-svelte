import { withKnobs, boolean, number } from "@storybook/addon-knobs";
import Component from "./Breadcrumb.Story.svelte";

export default { title: "Breadcrumb", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    noTrailingSlash: boolean("No Trailing Slash (noTrailingSlash)", false),
  },
});

export const Skeleton = () => ({
  Component,
  props: {
    story: "skeleton",
    noTrailingSlash: boolean("No Trailing Slash (noTrailingSlash)", false),
    count: number("Number of breadcrumb items (count)", 3),
  },
});

export const CurrentPage = () => ({
  Component,
  props: { story: "current page" },
});

export const CurrentPageWithAriaCurrent = () => ({
  Component,
  props: { story: "current page with aria-current" },
});
