import { render, screen } from "@testing-library/svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
];

describe("Dropdown aria forwarding", () => {
  it("joins a consumer aria-describedby on the combobox after the built-in ids", () => {
    const { container } = render(Dropdown, {
      props: {
        items,
        labelText: "Contact",
        helperText: "How we reach you",
        "aria-describedby": "extra-help",
      },
    });

    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(combobox).toHaveAccessibleDescription("How we reach you");
    expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
      combobox,
    ]);
  });

  it("names the combobox with a consumer aria-labelledby", () => {
    externalLabel("ext-label", "Contact method");
    const { container } = render(Dropdown, {
      props: { items, labelText: "Contact", "aria-labelledby": "ext-label" },
    });

    const combobox = screen.getByRole("combobox");
    expect(combobox).toHaveAccessibleName("Contact method");
    expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
      combobox,
    ]);
  });
});
