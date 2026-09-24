import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import NumberInputForm from "./NumberInput.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const flush = () => new Promise((resolve) => setTimeout(resolve));

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

  describe("form reset", () => {
    const setField = async (input: HTMLElement, text: string) => {
      await user.clear(input);
      await user.type(input, text);
    };

    it("keeps the value when the field cannot be empty", async () => {
      render(NumberInputForm, { props: { value: 5 } });
      const input = screen.getByRole("spinbutton", { name: "Amount" });

      await setField(input, "8");
      expect(getBound()).toBe("8");

      getForm().reset();
      await flush();

      expect(input).toHaveValue(8);
      expect(getBound()).toBe("8");
    });

    it("keeps a locale-formatted value in text mode", async () => {
      render(NumberInputForm, { props: { locale: "de-DE", value: 1234.5 } });
      const input = screen.getByRole("textbox", { name: "Amount" });

      getForm().reset();
      await flush();

      expect(input).toHaveValue("1.234,5");
      expect(getBound()).toBe("1234.5");
      expect(new FormData(getForm()).get("n")).toBe("1234.5");
    });

    it("follows the cleared field with allowEmpty", async () => {
      render(NumberInputForm, { props: { allowEmpty: true, value: 5 } });
      const input = screen.getByRole("spinbutton", { name: "Amount" });

      await setField(input, "8");
      getForm().reset();
      await flush();

      expect(input).toHaveValue(null);
      expect(getBound()).toBe("null");
    });

    it("follows the cleared field with allowEmpty in text mode", async () => {
      render(NumberInputForm, {
        props: { allowEmpty: true, locale: "en-US", value: 1234.5 },
      });
      const input = screen.getByRole("textbox", { name: "Amount" });

      getForm().reset();
      await flush();

      expect(input).toHaveValue("");
      expect(getBound()).toBe("null");
      expect(new FormData(getForm()).get("n")).toBe("");
    });

    it("keeps a read-only value with allowEmpty", async () => {
      render(NumberInputForm, {
        props: { allowEmpty: true, readonly: true, value: 5 },
      });
      const input = screen.getByRole("spinbutton", { name: "Amount" });

      getForm().reset();
      await flush();

      expect(input).toHaveValue(5);
      expect(getBound()).toBe("5");
    });
  });
});
