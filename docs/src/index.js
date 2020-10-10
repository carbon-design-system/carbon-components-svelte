import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app"),
  hydrate: process.env.NODE_ENV === "production",
});

export default app;
