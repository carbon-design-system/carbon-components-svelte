import "carbon-components-svelte/css/all.css";
import HMR from "@sveltech/routify/hmr";
import App from "./App.svelte";

const app = HMR(App, { target: document.body }, "routify-app");

export default app;
