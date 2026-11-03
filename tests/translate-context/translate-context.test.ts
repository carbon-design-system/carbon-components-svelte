import { render, screen } from "@testing-library/svelte";
import TranslateContext from "./TranslateContext.test.svelte";

const messages: Record<string, string> = {
  increment: "Erhöhen",
  decrement: "Verringern",
  clearSelection: "Auswahl löschen",
};
const translate = (id: string) => messages[id];

describe("setTranslateContext", () => {
  describe("translateWithId (NumberInput)", () => {
    it("falls back to English without a context or a prop", () => {
      render(TranslateContext);

      expect(
        screen.getByRole("button", { name: "Increment number" }),
      ).toBeInTheDocument();
    });

    it("uses the context over the English default", () => {
      render(TranslateContext, { props: { translate } });

      expect(
        screen.getByRole("button", { name: "Erhöhen" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Verringern" }),
      ).toBeInTheDocument();
    });

    it("uses the prop over the context", () => {
      render(TranslateContext, {
        props: { translate, numberInputProp: () => "Plus" },
      });

      expect(screen.getAllByRole("button", { name: "Plus" })).toHaveLength(2);
      expect(
        screen.queryByRole("button", { name: "Erhöhen" }),
      ).not.toBeInTheDocument();
    });

    it("keeps English for an id the context leaves out", () => {
      render(TranslateContext, {
        props: {
          translate: (id: string) =>
            id === "increment" ? "Erhöhen" : undefined,
        },
      });

      expect(
        screen.getByRole("button", { name: "Erhöhen" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Decrement number" }),
      ).toBeInTheDocument();
    });
  });

  describe("translateWithIdSelection (Dropdown)", () => {
    it("falls back to English without a context or a prop", () => {
      render(TranslateContext);

      expect(
        screen.getByRole("button", { name: "Clear selected item" }),
      ).toBeInTheDocument();
    });

    it("uses the context over the English default", () => {
      render(TranslateContext, { props: { translate } });

      expect(
        screen.getByRole("button", { name: "Auswahl löschen" }),
      ).toBeInTheDocument();
    });

    it("uses the prop over the context", () => {
      render(TranslateContext, {
        props: { translate, dropdownProp: () => "Entfernen" },
      });

      expect(
        screen.getByRole("button", { name: "Entfernen" }),
      ).toBeInTheDocument();
    });
  });
});
