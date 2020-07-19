import { withKnobs, boolean } from "@storybook/addon-knobs";
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
  props: { story: "skeleton" },
});

export const CurrentPage = () => ({
  Component,
  props: { story: "current page" },
});

export const CurrentPageWithAriaCurrent = () => ({
  Component,
  props: { story: "current page with aria-current" },
});
