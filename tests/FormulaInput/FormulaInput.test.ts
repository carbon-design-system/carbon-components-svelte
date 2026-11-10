import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FormulaInput from "./FormulaInput.test.svelte";

const field = () => screen.getByRole("textbox");
const layer = () => document.querySelector(".bx--formula-input__layer");

/** Put `text` in the field with the caret at its end, then focus it. */
async function typeFormula(text: string) {
  await user.click(field());
  await user.type(field(), text);
}

describe("FormulaInput", () => {
  it("is a labelled textbox that offers a list of suggestions", () => {
    render(FormulaInput);

    expect(screen.getByLabelText("Formula")).toBe(field());
    expect(field()).toHaveAttribute("aria-autocomplete", "list");
    expect(field()).not.toHaveAttribute("role");
    expect(field()).toHaveAttribute("dir", "ltr");
    expect(field()).toHaveAttribute("spellcheck", "false");
    expect(field()).not.toHaveAttribute("aria-expanded");
  });

  describe("highlighting", () => {
    it("repeats the text in a layer, a run for each kind of token", async () => {
      render(FormulaInput, {
        value: 'IF(status = "open", {price} * 2, 0)',
      });
      await tick();

      expect(layer()).toHaveAttribute("aria-hidden", "true");
      expect(layer()?.textContent).toBe('IF(status = "open", {price} * 2, 0)');
      expect(
        layer()?.querySelector(".bx--formula-input__function"),
      ).toHaveTextContent("IF");
      expect(
        layer()?.querySelector(".bx--formula-input__string"),
      ).toHaveTextContent('"open"');
      expect(
        [...document.querySelectorAll(".bx--formula-input__field")].map(
          (el) => el.textContent,
        ),
      ).toEqual(["status", "{price}"]);
      expect(
        layer()?.querySelector(".bx--formula-input__number"),
      ).toHaveTextContent("2");
    });

    it("marks the range of an error and updates as the text changes", async () => {
      render(FormulaInput, { value: "FOO(1)" });
      await tick();

      const marked = () => [
        ...document.querySelectorAll(".bx--formula-input__error"),
      ];
      expect(marked().map((el) => el.textContent)).toEqual(["FOO"]);

      await user.clear(field());
      await user.type(field(), "ROUND(1)");
      expect(marked()).toEqual([]);
      expect(layer()?.textContent).toBe("ROUND(1)");
    });
  });

  describe("errors", () => {
    it("marks the field invalid and points it at the first error", async () => {
      render(FormulaInput, { value: "ROUND(price" });
      await tick();

      const message = screen.getByText("Missing closing )");
      expect(field()).toHaveAttribute("aria-invalid", "true");
      expect(field()).toHaveAttribute("aria-errormessage", message.id);
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).not.toHaveAttribute("role", "alert");
      expect(screen.queryByText("Helper")).toBeNull();
    });

    it("says how many errors there are", async () => {
      render(FormulaInput, { value: "FOO(1) + BAR(2)" });
      await tick();

      expect(
        screen.getByText('Unknown function "FOO" (and 1 more error)'),
      ).toBeInTheDocument();
      expect(screen.getByTestId("errors")).toHaveTextContent("2");
    });

    it("is valid when the formula is", async () => {
      render(FormulaInput, { value: "price * qty" });
      await tick();

      expect(field()).not.toHaveAttribute("aria-invalid");
      expect(screen.getByText("Helper")).toBeInTheDocument();
    });

    it("lets the consumer's invalid text win", async () => {
      render(FormulaInput, {
        value: "FOO(1)",
        invalid: true,
        invalidText: "Not allowed here",
      });
      await tick();

      const message = screen.getByText("Not allowed here");
      expect(message).toHaveAttribute("role", "alert");
      expect(screen.queryByText(/Unknown function/)).toBeNull();
    });

    it("does not mark a read-only or disabled field", async () => {
      render(FormulaInput, { value: "FOO(1)", readonly: true });
      await tick();

      expect(field()).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("preview", () => {
    it("shows the result against the sample row", async () => {
      render(FormulaInput, {
        value: 'IF(status = "open", price * 1.2, ROUND(price, 2))',
      });
      await tick();

      expect(screen.getByText("Result")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(field().getAttribute("aria-describedby")).toContain(
        screen.getByText("120").parentElement?.id,
      );
    });

    it("follows the formula as it is typed", async () => {
      render(FormulaInput, { value: "price" });
      await tick();
      expect(screen.getByText("100")).toBeInTheDocument();

      await user.click(field());
      await user.type(field(), " + qty");
      expect(screen.getByText("103")).toBeInTheDocument();
    });

    it("shows a runtime error, and no result for a formula with errors", async () => {
      const { rerender } = render(FormulaInput, { value: "price / 0" });
      await tick();
      expect(screen.getByText("Division by zero")).toBeInTheDocument();

      await rerender({ value: "price /" });
      expect(screen.getByText("No result yet")).toBeInTheDocument();
    });
  });

  describe("suggestions", () => {
    it("lists functions and fields for what is typed, and accepts one with Tab", async () => {
      render(FormulaInput);
      await typeFormula("RO");

      const list = await screen.findByRole("listbox");
      expect(screen.getByRole("option", { name: /ROUND/ })).toBeInTheDocument();
      expect(field()).toHaveAttribute("aria-controls", list.id);
      expect(field()).toHaveAttribute(
        "aria-activedescendant",
        screen.getByRole("option", { name: /ROUND/ }).id,
      );

      await user.keyboard("{Tab}");
      expect(field()).toHaveValue("ROUND()");
      expect(screen.getByTestId("value")).toHaveTextContent("ROUND()");
      expect((field() as HTMLTextAreaElement).selectionStart).toBe(6);
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("moves with the arrow keys, accepts with Enter, and wraps", async () => {
      render(FormulaInput);
      await typeFormula("S");

      await screen.findByRole("listbox");
      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(2);
      await user.keyboard("{ArrowUp}");
      expect(field()).toHaveAttribute(
        "aria-activedescendant",
        options[options.length - 1].id,
      );
      await user.keyboard("{ArrowDown}");
      expect(field()).toHaveAttribute("aria-activedescendant", options[0].id);

      await user.keyboard("{ArrowDown}{Enter}");
      const chosen = options[1].querySelector(
        ".bx--formula-input__item-label",
      )?.textContent;
      expect(
        (field() as HTMLTextAreaElement).value.startsWith(chosen ?? "?"),
      ).toBe(true);
      expect(field()).not.toHaveValue(expect.stringContaining("\n"));
    });

    it("completes a field in braces, and closes the brace", async () => {
      render(FormulaInput);
      await typeFormula("{{Un");

      await user.keyboard("{Tab}");
      expect(field()).toHaveValue("{price}");
    });

    it("closes with Escape, and opens again with Control and Space", async () => {
      render(FormulaInput);
      await typeFormula("RO");
      await screen.findByRole("listbox");

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(field()).not.toHaveAttribute("aria-activedescendant");

      await user.keyboard("{Control>} {/Control}");
      expect(await screen.findByRole("listbox")).toBeInTheDocument();
    });

    it("offers every field with Control and Space where a value could start", async () => {
      render(FormulaInput);
      await user.click(field());
      expect(screen.queryByRole("listbox")).toBeNull();

      await user.keyboard("{Control>} {/Control}");
      expect(await screen.findByRole("listbox")).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /Unit price/ }),
      ).toBeInTheDocument();
    });

    it("offers nothing where an operator belongs", async () => {
      render(FormulaInput);
      await typeFormula("price ro");

      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("lets Enter add a line when nothing is offered", async () => {
      render(FormulaInput);
      await typeFormula("price{Enter}+ qty");

      expect(field()).toHaveValue("price\n+ qty");
    });
  });

  describe("signature help", () => {
    const signature = () =>
      document.querySelector(".bx--formula-input__signature");
    const active = () =>
      document.querySelector(".bx--formula-input__param--active");

    it("shows the signature with the argument the caret is in", async () => {
      render(FormulaInput);
      await typeFormula("ROUND(price, ");

      await waitFor(() => expect(signature()).not.toBeNull());
      expect(signature()).toHaveTextContent("ROUND(number, [digits])");
      expect(active()).toHaveTextContent("[digits]");
      expect(field().getAttribute("aria-describedby")).toContain(
        signature()?.id,
      );
    });

    it("marks the first argument", async () => {
      render(FormulaInput);
      await typeFormula("ROUND(");

      await waitFor(() => expect(active()).toHaveTextContent("number"));
    });

    it("goes away with Escape, and when the call is closed", async () => {
      render(FormulaInput);
      await typeFormula("ROUND(price, ");
      await waitFor(() => expect(signature()).not.toBeNull());

      await user.keyboard("{Escape}");
      expect(signature()).toBeNull();

      await user.keyboard("2)");
      expect(signature()).toBeNull();
    });
  });

  describe("keys", () => {
    it("steps over a closing parenthesis that is already there", async () => {
      render(FormulaInput, { value: "ROUND(price)" });
      await tick();
      await user.click(field());
      (field() as HTMLTextAreaElement).setSelectionRange(11, 11);
      await user.keyboard(")");

      expect(field()).toHaveValue("ROUND(price)");
      expect((field() as HTMLTextAreaElement).selectionStart).toBe(12);
    });

    it("types a closing parenthesis when one is missing", async () => {
      render(FormulaInput);
      await typeFormula("ROUND(price)");

      expect(field()).toHaveValue("ROUND(price)");
    });

    it("selects the next error with F8 and the one before with Shift and F8", async () => {
      render(FormulaInput, { value: "FOO(1) + 2 + BAR(3)" });
      await tick();
      await user.click(field());
      (field() as HTMLTextAreaElement).setSelectionRange(0, 0);

      await user.keyboard("{F8}");
      const el = field() as HTMLTextAreaElement;
      expect(el.value.slice(el.selectionStart, el.selectionEnd)).toBe("BAR");
      expect(await screen.findByText(/Error 2 of 2/)).toBeInTheDocument();

      await user.keyboard("{Shift>}{F8}{/Shift}");
      expect(el.value.slice(el.selectionStart, el.selectionEnd)).toBe("FOO");
    });
  });
});
