// @vitest-environment node
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { renderSSR } from "../utils/ssr";

const items = [
  { id: "us", text: "US East" },
  { id: "eu", text: "EU West" },
];

it("renders the selected item's text in the input", () => {
  const { document } = renderSSR(ComboBox, {
    labelText: "Region",
    selectedId: "eu",
    items,
  });

  expect(document.querySelector("input")?.getAttribute("value")).toBe(
    "EU West",
  );
});
