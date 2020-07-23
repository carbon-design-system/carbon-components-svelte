import { withKnobs, number, boolean } from "@storybook/addon-knobs";
import Component from "./PaginationNav.Story.svelte";

export default { title: "PaginationNav", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    page: number("Current page index (page)", 0),
    total: number("Total number of items (total)", 10),
    shown: number("Number of items to be shown (minimum 4) (shown)", 10),
    loop: boolean(
      "Allow user to loop through the items when reaching first / last (loop)",
      false
    ),
  },
});
