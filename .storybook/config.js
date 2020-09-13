import { configure } from "@storybook/svelte";
import "../css/g10.css";

configure(require.context("../src", true, /\.stories\.js$/), module);
