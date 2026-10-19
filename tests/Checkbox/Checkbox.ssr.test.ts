// @vitest-environment node
import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
import { renderSSR } from "../utils/ssr";

describe("Checkbox server render", () => {
  // `indeterminate` is a DOM property with no attribute, so server markup
  // can't carry it on the input; the label's state hook draws the dash
  // until hydration sets the property.
  it("marks an indeterminate checkbox on its label", () => {
    const { document } = renderSSR(Checkbox, {
      labelText: "Select all",
      indeterminate: true,
    });

    expect(document.querySelector(".bx--checkbox-label")).toHaveAttribute(
      "data-contained-checkbox-state",
      "mixed",
    );
  });

  it("marks a disabled indeterminate checkbox for the disabled dash", () => {
    const { document } = renderSSR(Checkbox, {
      labelText: "Select all",
      indeterminate: true,
      disabled: true,
    });

    expect(document.querySelector(".bx--checkbox-label")).toHaveAttribute(
      "data-contained-checkbox-disabled",
      "true",
    );
  });
});
