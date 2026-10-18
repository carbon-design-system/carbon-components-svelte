import { mount } from "./mount";

// Mounts one DatePicker docs example, named by `?example=`, so the layout
// checks run against exactly what the docs render.
const examples = import.meta.glob(
  "../../docs/src/pages/framed/DatePicker/*.svelte",
);
const name = new URLSearchParams(location.search).get("example");
// A Map lookup, so a crafted `?example=` (`constructor`, say) finds nothing
// instead of an inherited method.
const load = new Map(Object.entries(examples)).get(
  `../../docs/src/pages/framed/DatePicker/${name}.svelte`,
);

load?.().then((module) => {
  mount((module as { default: Parameters<typeof mount>[0] }).default);
  document.body.dataset.ready = "true";
});
