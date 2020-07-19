import { withKnobs } from "@storybook/addon-knobs";
import Component from "./FormItem.Story.svelte";

export default { title: "FormItem", decorators: [withKnobs] };

export const Default = () => ({ Component });
