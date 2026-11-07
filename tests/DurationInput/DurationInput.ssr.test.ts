// @vitest-environment node
import DurationInput from "carbon-components-svelte/DurationInput/DurationInput.svelte";
import { renderSSR } from "../utils/ssr";

describe("DurationInput server render", () => {
  it("writes the segments, unit labels and spoken duration", () => {
    const { document } = renderSSR(DurationInput, {
      value: 5_400_000,
      labelText: "Length",
      name: "length",
    });

    const segments = [...document.querySelectorAll("input[role=spinbutton]")];
    expect(segments.map((s) => s.getAttribute("value"))).toEqual([
      "01",
      "30",
      "00",
    ]);
    expect(segments[0]).toHaveAttribute("aria-valuetext", "1 hour, 30 minutes");
    expect(
      [...document.querySelectorAll(".bx--duration-input__unit")].map(
        (unit) => unit.textContent,
      ),
    ).toEqual(["h", "m", "s"]);
    expect(document.querySelector("input[type=hidden]")).toHaveAttribute(
      "value",
      "5400000",
    );
  });

  it("writes the text variant as the syntax it reads back", () => {
    const { document } = renderSSR(DurationInput, {
      variant: "text",
      value: 5_400_000,
      labelText: "Length",
    });

    expect(document.querySelector("input[type=text]")).toHaveValue("1h 30m");
  });

  it("renders the same markup twice, so a client can hydrate it", () => {
    const props = { value: 61_000, id: "duration", locale: "de" };

    expect(renderSSR(DurationInput, props).html).toBe(
      renderSSR(DurationInput, props).html,
    );
  });
});
