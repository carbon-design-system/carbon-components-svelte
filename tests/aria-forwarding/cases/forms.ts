import { render, screen } from "@testing-library/svelte";
import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
import type { AriaEntry } from "../contract";

export const forms: AriaEntry[] = [
  {
    name: "Checkbox",
    render: (attrs) =>
      render(Checkbox, {
        props: { labelText: "Subscribe", helperText: "Weekly", ...attrs },
      }),
    target: () => screen.getByRole("checkbox"),
  },
  {
    name: "TextInput",
    render: (attrs) =>
      render(TextInput, {
        props: { labelText: "Name", helperText: "Full name", ...attrs },
      }),
    target: () => screen.getByRole("textbox"),
  },
];
