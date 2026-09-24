import { menuOptionLabel } from "../../src/utils/menu-option-label.js";

describe("menuOptionLabel", () => {
  it("reads the .bx--menu-option__label child when present", () => {
    const item = document.createElement("li");
    item.innerHTML = `<span class="bx--menu-option__label">  Copy  </span>`;
    expect(menuOptionLabel(item)).toBe("Copy");
  });

  it("falls back to the element's own text content", () => {
    const item = document.createElement("li");
    item.textContent = "  Delete  ";
    expect(menuOptionLabel(item)).toBe("Delete");
  });

  it("returns an empty string when there is no text", () => {
    const item = document.createElement("li");
    expect(menuOptionLabel(item)).toBe("");
  });
});
