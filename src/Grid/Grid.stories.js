import { withKnobs } from "@storybook/addon-knobs";
import Component from "./Grid.Story.svelte";

export default { title: "Grid", decorators: [withKnobs] };

export const Default = () => ({ Component });
