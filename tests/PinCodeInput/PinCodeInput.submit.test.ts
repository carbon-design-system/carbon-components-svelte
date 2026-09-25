import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { getPinCodeInputs as getInputs } from "./helpers";
import PinCodeInputSubmit from "./PinCodeInput.submit.test.svelte";

describe("PinCodeInput submitOnComplete", () => {
  it("submits the new value when typing fills the last segment", async () => {
    const onSubmit = vi.fn();
    render(PinCodeInputSubmit, { props: { onSubmit } });

    getInputs()[0].focus();
    await user.keyboard("1234");
    await tick();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("1234");
  });

  it("does not submit a partial code", async () => {
    const onSubmit = vi.fn();
    render(PinCodeInputSubmit, { props: { onSubmit } });

    getInputs()[0].focus();
    await user.keyboard("123");
    await tick();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits after a full paste", async () => {
    const onSubmit = vi.fn();
    render(PinCodeInputSubmit, { props: { onSubmit } });

    const inputs = getInputs();
    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "5678" },
    });
    await tick();
    await tick();

    expect(onSubmit).toHaveBeenCalledWith("5678");
  });

  it("submits again after a correction to a full code", async () => {
    const onSubmit = vi.fn();
    render(PinCodeInputSubmit, { props: { onSubmit } });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("1234");
    await tick();
    await user.click(inputs[3]);
    await user.keyboard("9");
    await tick();

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenLastCalledWith("1239");
  });

  it("does not submit when off", async () => {
    const onSubmit = vi.fn();
    render(PinCodeInputSubmit, {
      props: { onSubmit, submitOnComplete: false },
    });

    getInputs()[0].focus();
    await user.keyboard("1234");
    await tick();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not submit on a programmatic code change", async () => {
    const onSubmit = vi.fn();
    const { component } = render(PinCodeInputSubmit, { props: { onSubmit } });

    component.code = ["1", "2", "3", "4"];
    await tick();
    await tick();

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
