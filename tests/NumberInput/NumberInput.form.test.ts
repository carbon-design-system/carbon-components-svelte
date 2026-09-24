import { render, screen } from "@testing-library/svelte";
import NumberInputForm from "./NumberInput.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;

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
});
