import { render, screen } from "@testing-library/svelte";
import RadioTileTest from "./RadioTile.test.svelte";

describe("RadioTile", () => {
  describe("aria attributes", () => {
    it("should apply aria-describedby to the input element, not the label", () => {
      render(RadioTileTest, { ariaDescribedBy: "description-id" });

      const input = screen.getByRole("radio");
      expect(input).toHaveAttribute("aria-describedby", "description-id");

      const label = input.nextElementSibling;
      assert(label instanceof HTMLLabelElement);
      expect(label.tagName).toBe("LABEL");
      expect(label).not.toHaveAttribute("aria-describedby");
    });

    it("should apply aria-labelledby to the input element, not the label", () => {
      render(RadioTileTest, { ariaLabelledBy: "label-id" });

      const input = screen.getByRole("radio");
      expect(input).toHaveAttribute("aria-labelledby", "label-id");

      const label = input.nextElementSibling;
      assert(label instanceof HTMLLabelElement);
      expect(label.tagName).toBe("LABEL");
      expect(label).not.toHaveAttribute("aria-labelledby");
    });

    it("should apply both aria-describedby and aria-labelledby to the input element", () => {
      render(RadioTileTest, {
        ariaDescribedBy: "description-id",
        ariaLabelledBy: "label-id",
      });

      const input = screen.getByRole("radio");
      expect(input).toHaveAttribute("aria-describedby", "description-id");
      expect(input).toHaveAttribute("aria-labelledby", "label-id");

      const label = input.nextElementSibling;
      assert(label instanceof HTMLLabelElement);
      expect(label.tagName).toBe("LABEL");
      expect(label).not.toHaveAttribute("aria-describedby");
      expect(label).not.toHaveAttribute("aria-labelledby");
    });
  });
});
