import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import NumberInputForm from "./NumberInput.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const getField = () => screen.getByLabelText("Amount") as HTMLInputElement;

describe("NumberInput form participation", () => {
  describe("validity", () => {
    it("does not block submission for a decimal value", () => {
      render(NumberInputForm, { props: { allowDecimal: true, value: 1.5 } });

      expect(getForm().checkValidity()).toBe(true);
    });

    it("does not block submission for a locale-formatted value", () => {
      render(NumberInputForm, { props: { locale: "en-US", value: 1234.5 } });

      expect(getForm().checkValidity()).toBe(true);
    });
  });

  describe("submitted value", () => {
    const submitted = () => new FormData(getForm()).getAll("n");

    it("submits the number, not the de-DE display text", () => {
      render(NumberInputForm, { props: { locale: "de-DE", value: 1234.5 } });

      expect(screen.getByRole("textbox", { name: "Amount" })).toHaveValue(
        "1.234,5",
      );
      expect(submitted()).toEqual(["1234.5"]);
    });

    it("submits the number when formatOptions pad the display", () => {
      render(NumberInputForm, {
        props: {
          locale: "en-US",
          formatOptions: { minimumFractionDigits: 2 },
          value: 1234.5,
        },
      });

      expect(submitted()).toEqual(["1234.5"]);
    });

    it("submits an empty string when empty", () => {
      render(NumberInputForm, { props: { locale: "en-US" } });

      expect(submitted()).toEqual([""]);
    });

    it("submits 0", () => {
      render(NumberInputForm, { props: { locale: "en-US", value: 0 } });

      expect(submitted()).toEqual(["0"]);
    });

    it("follows typing before blur", async () => {
      render(NumberInputForm, { props: { locale: "de-DE" } });
      const input = screen.getByRole("textbox", { name: "Amount" });

      await user.type(input, "12,5");

      expect(submitted()).toEqual(["12.5"]);
    });

    it("omits the field while disabled", () => {
      render(NumberInputForm, {
        props: { locale: "en-US", value: 3, disabled: true },
      });

      expect(submitted()).toEqual([]);
    });

    it("keeps the name off the visible text input", () => {
      render(NumberInputForm, { props: { locale: "en-US", value: 3 } });

      expect(
        screen.getByRole("textbox", { name: "Amount" }),
      ).not.toHaveAttribute("name");
    });

    it("submits one entry in the default number mode", () => {
      render(NumberInputForm, { props: { value: 7 } });

      expect(submitted()).toEqual(["7"]);
    });
  });
});

describe("NumberInput form reset", () => {
  it("follows the field's default value without a change event", async () => {
    const onChange = vi.fn();
    render(NumberInputForm, { props: { value: 7, onChange } });
    const field = getField();
    // Server-rendered markup carries the value as the `value` attribute.
    field.defaultValue = "3";

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue(3);
    expect(getBound()).toBe("3");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps 0 as a value", async () => {
    render(NumberInputForm, { props: { value: 7 } });
    getField().defaultValue = "0";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("0");
  });

  it("clears to null with allowEmpty", async () => {
    render(NumberInputForm, { props: { value: 7, allowEmpty: true } });
    const field = getField();

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue(null);
    expect(getBound()).toBe("null");
  });

  it("puts the field back when empty is not allowed", async () => {
    render(NumberInputForm, { props: { value: 7 } });
    const field = getField();

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue(7);
    expect(getBound()).toBe("7");
  });

  it("keeps a read-only input as it was", async () => {
    render(NumberInputForm, { props: { value: 7, readonly: true } });
    const field = getField();
    field.defaultValue = "3";

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue(7);
    expect(getBound()).toBe("7");
  });

  it("parses a locale field", async () => {
    render(NumberInputForm, { props: { value: 7, locale: "de-DE" } });
    const field = getField();
    field.defaultValue = "1.234,5";

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue("1.234,5");
    expect(getBound()).toBe("1234.5");
  });

  it("puts a locale field back when empty is not allowed", async () => {
    render(NumberInputForm, { props: { value: 1234.5, locale: "de-DE" } });
    const field = getField();

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue("1.234,5");
    expect(getBound()).toBe("1234.5");
  });
});
