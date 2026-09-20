import { mount } from "svelte";
import App from "./App.svelte";
import "../../css/all.css";
import "../../css/viz.css";
import "./global.css";

const app = mount(App, { target: document.body });

export default app;
