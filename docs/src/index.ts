import { mount } from "svelte";
import App from "./App.svelte";
import "../../css/all.css";
import "../../css/syntax-tokens.css";
import "../../css/syntax.css";
import "./global.css";

const app = mount(App, { target: document.body });

export default app;
