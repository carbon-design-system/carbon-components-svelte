import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import { getPinCodeInputs } from "./helpers";
import PinCodeInputForm from "./PinCodeInput.form.test.svelte";
import PinCodeInputFormAttribute from "./PinCodeInput.formAttribute.test.svelte";

const getSegments = () => getPinCodeInputs().map((input) => input.value);
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

  describe("form reset", () => {
    it("clears the code and the submitted value without firing events", async () => {
      const onClear = vi.fn();
      const onComplete = vi.fn();
      const onChange = vi.fn();
      render(PinCodeInputForm, { props: { onClear, onComplete, onChange } });

      await user.click(screen.getAllByRole("textbox")[0]);
      await user.keyboard("1234");
      expect(getBoundText()).toBe("1234");
      onClear.mockClear();
      onComplete.mockClear();
      onChange.mockClear();

      await resetForm();

      expect(getSegments()).toEqual(["", "", "", ""]);
      expect(getBoundText()).toBe("");
      expect(new FormData(getForm()).get("otp")).toBe("");
      expect(onClear).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not merge the next keystroke into the old code", async () => {
      render(PinCodeInputForm);

      await user.click(screen.getAllByRole("textbox")[0]);
      await user.keyboard("1234");
      await resetForm();

      // user-event tracks what it typed and misses the native reset, so
      // type the next character with a plain input event.
      const second = getPinCodeInputs()[1];
      second.value = "9";
      second.dispatchEvent(new Event("input", { bubbles: true }));
      await tick();

      expect(getSegments()).toEqual(["", "9", "", ""]);
      expect(getBoundText()).toBe("9");
    });
  });

  it("submits with the form named by the `form` attribute", () => {
    render(PinCodeInputFormAttribute);

    expect(new FormData(getForm()).get("otp")).toBe("1234");
  });

  it("validates required segments against the form named by `form`", () => {
    render(PinCodeInputFormAttribute, { props: { value: "", required: true } });

    expect(getForm().checkValidity()).toBe(false);
  });
});
