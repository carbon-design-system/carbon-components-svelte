import { get } from "svelte/store";
import {
  createFormParts,
  partsDescribedBy,
} from "../../src/utils/form-parts.js";

describe("createFormParts", () => {
  it("registers, re-registers, and unregisters a part's id", () => {
    const { parts, part } = createFormParts();
    const setHelper = part("helper");

    setHelper("helper-a");
    expect(get(parts).helper).toEqual(["helper-a"]);

    setHelper("helper-b");
    expect(get(parts).helper).toEqual(["helper-b"]);

    setHelper(undefined);
    expect(get(parts).helper).toEqual([]);
  });

  it("keeps parts of the same kind independent", () => {
    const { parts, part } = createFormParts();
    const first = part("warn");
    const second = part("warn");

    first("warn-1");
    second("warn-2");
    first(undefined);

    expect(get(parts).warn).toEqual(["warn-2"]);
  });
});

describe("partsDescribedBy", () => {
  it("orders invalid, then warn, then helper ids", () => {
    expect(
      partsDescribedBy({
        label: ["label-x"],
        helper: ["helper-x"],
        invalid: ["error-x"],
        warn: ["warn-x"],
      }),
    ).toBe("error-x warn-x helper-x");
  });

  it("returns undefined with nothing to describe", () => {
    expect(
      partsDescribedBy({
        label: ["label-x"],
        helper: [],
        invalid: [],
        warn: [],
      }),
    ).toBeUndefined();
  });
});
