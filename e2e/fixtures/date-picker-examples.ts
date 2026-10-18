import { mount } from "./mount";

// Mounts one DatePicker docs example, named by `?example=`, so the layout
// checks run against exactly what the docs render. `?dir=rtl` mounts it in a
// right-to-left page.
const examples = import.meta.glob(
  "../../docs/src/pages/framed/DatePicker/*.svelte",
);
const params = new URLSearchParams(location.search);
const name = params.get("example");
if (params.get("dir") === "rtl") document.documentElement.dir = "rtl";
// Match by comparing paths rather than indexing with the query string, so
// a crafted `?example=` can only find a real example or nothing.
const path = `../../docs/src/pages/framed/DatePicker/${name}.svelte`;
const load = Object.entries(examples).find(([key]) => key === path)?.[1];

load?.().then((module) => {
  mount((module as { default: Parameters<typeof mount>[0] }).default);
  document.body.dataset.ready = "true";
});
