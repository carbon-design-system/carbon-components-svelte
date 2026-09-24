import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import PinCodeInputForm from "./PinCodeInput.form.test.svelte";

const getSegments = () =>
  (screen.getAllByRole("textbox") as HTMLInputElement[]).map(
    (input) => input.value,
  );
const getBound = () => screen.getByTestId("bound").textContent;
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
      expect(getBound()).toBe("1234");
      onClear.mockClear();
      onComplete.mockClear();
      onChange.mockClear();

      getForm().reset();
      await flushFormReset();

      expect(getSegments()).toEqual(["", "", "", ""]);
      expect(getBound()).toBe("");
      expect(new FormData(getForm()).get("otp")).toBe("");
      expect(onClear).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not merge the next keystroke into the old code", async () => {
      render(PinCodeInputForm);

      await user.click(screen.getAllByRole("textbox")[0]);
      await user.keyboard("1234");
      getForm().reset();
      await flushFormReset();

      // user-event tracks what it typed and misses the native reset, so
      // type the next character with a plain input event.
      const second = screen.getAllByRole("textbox")[1] as HTMLInputElement;
      second.value = "9";
      second.dispatchEvent(new Event("input", { bubbles: true }));
      await tick();

      expect(getSegments()).toEqual(["", "9", "", ""]);
      expect(getBound()).toBe("9");
    });

    it("follows the segments' default values, as with server-rendered markup", async () => {
      render(PinCodeInputForm, { props: { value: "12" } });
      const segments = screen.getAllByRole("textbox") as HTMLInputElement[];
      // Server-rendered markup carries each character as the `value` attribute.
      segments[0].defaultValue = "1";
      segments[1].defaultValue = "2";

      await user.click(segments[2]);
      await user.keyboard("34");
      expect(getBound()).toBe("1234");

      getForm().reset();
      await flushFormReset();

      expect(getSegments()).toEqual(["1", "2", "", ""]);
      expect(getBound()).toBe("12");
      expect(new FormData(getForm()).get("otp")).toBe("12");
    });

    it("leaves everything alone when the reset is canceled", async () => {
      render(PinCodeInputForm);
      getForm().addEventListener("reset", (event) => event.preventDefault());

      await user.click(screen.getAllByRole("textbox")[0]);
      await user.keyboard("12");
      getForm().reset();
      await flushFormReset();

      expect(getSegments()).toEqual(["1", "2", "", ""]);
      expect(getBound()).toBe("12");
    });
  });
});
