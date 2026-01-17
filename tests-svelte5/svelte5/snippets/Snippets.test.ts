import { render, screen } from "@testing-library/svelte";
import { user } from "../../setup-tests";
import Snippets from "./Snippets.test.svelte";

describe("Svelte 5 Snippets", () => {
  describe("Dropdown", () => {
    it("should render snippet with item and index arguments", async () => {
      render(Snippets);

      const dropdown = screen.getByTestId("dropdown-snippet");
      expect(dropdown).toBeInTheDocument();

      const button = dropdown.querySelector("button");
      expect.assert(button);
      await user.click(button);

      const item0 = screen.getByTestId("dropdown-item-0");
      const item1 = screen.getByTestId("dropdown-item-1");
      const item2 = screen.getByTestId("dropdown-item-2");

      expect(item0).toHaveTextContent("Option 1 (#0)");
      expect(item1).toHaveTextContent("Option 2 (#1)");
      expect(item2).toHaveTextContent("Option 3 (#2)");
    });
  });

  describe("ComboBox", () => {
    it("should render snippet with item and index arguments", async () => {
      render(Snippets);

      const inputs = screen.getAllByRole("combobox");
      const comboboxInput = inputs[0];
      expect(comboboxInput).toBeInTheDocument();

      await user.click(comboboxInput);

      const item0 = screen.getByTestId("combobox-item-0");
      const item1 = screen.getByTestId("combobox-item-1");
      const item2 = screen.getByTestId("combobox-item-2");

      expect(item0).toHaveTextContent("Option 1 - index 0");
      expect(item1).toHaveTextContent("Option 2 - index 1");
      expect(item2).toHaveTextContent("Option 3 - index 2");
    });
  });

  describe("Button", () => {
    it("should render snippet with props argument when using 'as' prop", () => {
      render(Snippets);

      const customButton = screen.getByTestId("custom-button");
      expect(customButton).toBeInTheDocument();
      expect(customButton).toHaveTextContent("Custom Button Element");

      expect(customButton.tagName).toBe("DIV");
      expect(customButton).toHaveClass("bx--btn");
    });
  });

  describe("Theme", () => {
    it("should render snippet with theme argument", () => {
      render(Snippets);

      const themeValue = screen.getByTestId("theme-value");
      expect(themeValue).toBeInTheDocument();

      expect(themeValue).toHaveTextContent("Current theme:");
      expect(themeValue.textContent).toMatch(
        /Current theme: (white|g10|g80|g90|g100)/,
      );
    });
  });
});
