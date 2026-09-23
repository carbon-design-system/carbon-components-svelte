import { render, screen } from "@testing-library/svelte";
import PinCodeInputForm from "./PinCodeInput.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;

describe("PinCodeInput form participation", () => {
  describe("required with name", () => {
    it("is invalid while every segment is empty", () => {
      render(PinCodeInputForm, { props: { required: true } });

      expect(getForm().checkValidity()).toBe(false);
    });

    it("is invalid while the code is partial", () => {
      render(PinCodeInputForm, { props: { required: true, value: "12" } });

      expect(getForm().checkValidity()).toBe(false);
    });

    it("is valid and submits the code once every segment is filled", () => {
      render(PinCodeInputForm, { props: { required: true, value: "1234" } });

      expect(getForm().checkValidity()).toBe(true);
      expect(new FormData(getForm()).get("otp")).toBe("1234");
    });

    it("is valid when empty and not required", () => {
      render(PinCodeInputForm);

      expect(getForm().checkValidity()).toBe(true);
      expect(new FormData(getForm()).get("otp")).toBe("");
    });
  });
});
