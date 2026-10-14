import { render } from "@testing-library/svelte";
import { carriersOf, externalLabel } from "../utils/aria-forwarding";
import TimePickerSelectAria from "./TimePickerSelect.ariaForwarding.test.svelte";

describe.each([false, true])(
  "TimePickerSelect aria forwarding (fluid: %s)",
  (fluid) => {
    it("joins a consumer aria-describedby on the select after the built-in ids", () => {
      const { container } = render(TimePickerSelectAria, {
        props: {
          fluid,
          selectProps: { readonly: true, "aria-describedby": "extra-help" },
        },
      });

      const select = container.querySelector("select");
      expect(select).toHaveAttribute(
        "aria-describedby",
        expect.stringMatching(/^\S+ extra-help$/),
      );
      expect(select).toHaveAccessibleDescription("Read-only");
      expect(carriersOf(container, "aria-describedby", "extra-help")).toEqual([
        select,
      ]);
    });

    it("names the select with a consumer aria-labelledby", () => {
      externalLabel("ext-label", "Time of day");
      const { container } = render(TimePickerSelectAria, {
        props: { fluid, selectProps: { "aria-labelledby": "ext-label" } },
      });

      const select = container.querySelector("select");
      expect(select).toHaveAccessibleName("Time of day");
      expect(carriersOf(container, "aria-labelledby", "ext-label")).toEqual([
        select,
      ]);
    });

    it("names the select with a consumer aria-label", () => {
      const { container } = render(TimePickerSelectAria, {
        props: { fluid, selectProps: { "aria-label": "Time of day" } },
      });

      expect(container.querySelector("select")).toHaveAccessibleName(
        "Time of day",
      );
      expect(container.querySelector(".bx--select")).not.toHaveAttribute(
        "aria-label",
      );
    });
  },
);
