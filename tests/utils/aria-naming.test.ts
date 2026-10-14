// @vitest-environment node
import { splitAriaNaming } from "../../src/utils/aria-naming.js";

describe("splitAriaNaming", () => {
  it("splits naming and description attributes from the rest", () => {
    expect(
      splitAriaNaming({
        "aria-label": "Name",
        "aria-labelledby": "label-id",
        "aria-describedby": "help-id",
        "data-testid": "field",
        class: "custom",
      }),
    ).toEqual({
      ariaLabel: "Name",
      ariaLabelledBy: "label-id",
      ariaDescribedBy: "help-id",
      rest: { "data-testid": "field", class: "custom" },
    });
  });

  it("leaves other aria attributes in the rest", () => {
    expect(splitAriaNaming({ "aria-hidden": "true" })).toEqual({
      ariaLabel: undefined,
      ariaLabelledBy: undefined,
      ariaDescribedBy: undefined,
      rest: { "aria-hidden": "true" },
    });
  });
});
