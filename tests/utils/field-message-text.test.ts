import { render } from "@testing-library/svelte";
import Checkbox from "../../src/Checkbox/Checkbox.svelte";
import NumberInput from "../../src/NumberInput/NumberInput.svelte";
import PinCodeInput from "../../src/PinCodeInput/PinCodeInput.svelte";
import Search from "../../src/Search/Search.svelte";
import Select from "../../src/Select/Select.svelte";
import Slider from "../../src/Slider/Slider.svelte";
import TagInput from "../../src/TagInput/TagInput.svelte";
import TextArea from "../../src/TextArea/TextArea.svelte";
import PasswordInput from "../../src/TextInput/PasswordInput.svelte";
import TextInput from "../../src/TextInput/TextInput.svelte";
import TimePicker from "../../src/TimePicker/TimePicker.svelte";
import Toggle from "../../src/Toggle/Toggle.svelte";

// A field can be invalid or warned without text of its own, as inside an
// InputGroup that shows one message for the row. It then keeps its state
// but renders no empty message for assistive technology to land on.
type Status = { invalid?: boolean; warn?: boolean; helperText?: string };

const fields: Array<[string, (status: Status) => ReturnType<typeof render>]> = [
  [
    "TextInput",
    (status) => render(TextInput, { labelText: "Name", ...status }),
  ],
  [
    "PasswordInput",
    (status) => render(PasswordInput, { labelText: "Password", ...status }),
  ],
  [
    "NumberInput",
    (status) => render(NumberInput, { labelText: "Amount", ...status }),
  ],
  ["TextArea", (status) => render(TextArea, { labelText: "Notes", ...status })],
  ["Search", (status) => render(Search, { labelText: "Search", ...status })],
  ["Select", (status) => render(Select, { labelText: "Region", ...status })],
  ["TagInput", (status) => render(TagInput, { labelText: "Tags", ...status })],
  [
    "TimePicker",
    (status) => render(TimePicker, { labelText: "Time", ...status }),
  ],
  ["Slider", (status) => render(Slider, { labelText: "Volume", ...status })],
  [
    "PinCodeInput",
    (status) => render(PinCodeInput, { labelText: "Code", ...status }),
  ],
  ["Checkbox", (status) => render(Checkbox, { labelText: "Agree", ...status })],
];

describe("field messages without text", () => {
  it.each(fields)("%s renders no empty invalid message", (_, renderField) => {
    const { container } = renderField({ invalid: true, helperText: "Help" });

    expect(container.querySelector("[role=alert]")).toBeNull();
    expect(container.querySelector(".bx--form-requirement")).toBeNull();
    expect(container.querySelector("[aria-errormessage]")).toBeNull();
    // Invalid still replaces the helper text.
    expect(container).not.toHaveTextContent("Help");
  });

  it.each([
    ...fields,
    [
      "Toggle",
      ({ warn }: Status) => render(Toggle, { labelText: "Sync", warn }),
    ] as const,
  ])("%s renders no empty warning message", (_, renderField) => {
    const { container } = renderField({ warn: true });

    expect(container.querySelector(".bx--form-requirement")).toBeNull();
    for (const element of container.querySelectorAll("[aria-describedby]")) {
      const ids = element.getAttribute("aria-describedby") ?? "";
      for (const id of ids.split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    }
  });

  const fluid = { labelText: "Field", fluid: true, invalid: true };

  it.each([
    ["TextArea", () => render(TextArea, fluid)],
    ["Search", () => render(Search, fluid)],
    ["PinCodeInput", () => render(PinCodeInput, fluid)],
  ] as const)(
    "fluid %s announces no empty invalid message",
    (_, renderField) => {
      const { container } = renderField();

      expect(container.querySelector("[role=alert]")).toBeNull();
    },
  );
});
