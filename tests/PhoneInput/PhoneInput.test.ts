import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import PhoneInput from "./PhoneInput.test.svelte";

const number = () => screen.getByRole("textbox") as HTMLInputElement;
const text = (id: string) => screen.getByTestId(id).textContent;

/** The event a browser sends for a paste into a text field. */
function paste(field: HTMLInputElement, data: string) {
  field.focus();
  field.setSelectionRange(0, field.value.length);
  field.dispatchEvent(
    new InputEvent("beforeinput", {
      inputType: "insertFromPaste",
      data,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe("PhoneInput", () => {
  it("masks the number for the country and binds the E.164 value", async () => {
    render(PhoneInput, { props: { country: "US" } });
    await user.type(number(), "4155550123");

    expect(number()).toHaveValue("(415) 555-0123");
    expect(text("value")).toBe("+14155550123");
    expect(text("complete")).toBe("true");
  });

  it("is not complete until the number has its digits", async () => {
    render(PhoneInput, { props: { country: "US" } });
    await user.type(number(), "415555");

    expect(text("value")).toBe("+1415555");
    expect(text("complete")).toBe("false");
  });

  it("reads a value it starts with and fills the country", async () => {
    render(PhoneInput, { props: { value: "+442079460958" } });
    await tick();

    expect(text("country")).toBe("GB");
    expect(number()).toHaveValue("020 7946 0958");
  });

  it("takes a typed trunk prefix as part of the national format", async () => {
    render(PhoneInput, { props: { country: "GB" } });
    await user.type(number(), "02079460958");

    expect(number()).toHaveValue("020 7946 0958");
    expect(text("value")).toBe("+442079460958");
  });

  it("switches the country for a pasted international number", async () => {
    render(PhoneInput, { props: { country: "US" } });
    paste(number(), "+44 20 7946 0958");
    await tick();

    expect(text("country")).toBe("GB");
    expect(number()).toHaveValue("020 7946 0958");
    expect(text("value")).toBe("+442079460958");
  });

  it("keeps the country when the code is shared", async () => {
    render(PhoneInput, { props: { country: "CA" } });
    paste(number(), "+1 (415) 555-0123");
    await tick();

    expect(text("country")).toBe("CA");
    expect(text("value")).toBe("+14155550123");
  });

  it("ignores a pasted code for a country the list leaves out", async () => {
    render(PhoneInput, { props: { country: "CH", countries: ["CH", "AT"] } });
    await user.type(number(), "791234567");
    paste(number(), "+49 30 12345678");
    await tick();

    expect(text("country")).toBe("CH");
  });

  it("re-masks the digits when another country is chosen", async () => {
    render(PhoneInput, { props: { country: "US" } });
    await user.type(number(), "4155550123");

    await user.type(screen.getByRole("combobox"), "switz");
    await user.click(await screen.findByText("Switzerland"));

    expect(text("country")).toBe("CH");
    expect(number()).toHaveValue("041 555 50 12");
    expect(text("value")).toBe("+41415555012");
  });

  it("dispatches change with the whole state when the user types", async () => {
    const onChange = vi.fn();
    render(PhoneInput, { props: { country: "US", onChange } });
    await user.type(number(), "415");

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: {
          value: "+1415",
          country: "US",
          national: "(415",
          complete: false,
        },
      }),
    );
  });

  it("does not dispatch change when the value is set from outside", async () => {
    const onChange = vi.fn();
    const { rerender } = render(PhoneInput, {
      props: { country: "US", onChange },
    });
    await rerender({ value: "+14155550123" });

    expect(number()).toHaveValue("(415) 555-0123");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("submits the E.164 value under name, not the text that is shown", async () => {
    const { container } = render(PhoneInput, {
      props: { country: "US", name: "phone" },
    });
    await user.type(number(), "4155550123");

    expect(
      new FormData(container.querySelector("form") as HTMLFormElement).get(
        "phone",
      ),
    ).toBe("+14155550123");
  });

  it("clears the number with an empty value", async () => {
    const { rerender } = render(PhoneInput, {
      props: { value: "+14155550123" },
    });
    await tick();
    await rerender({ value: "" });

    expect(number()).toHaveValue("");
    expect(text("complete")).toBe("false");
  });

  it("names the number field and the country selector for assistive technology", () => {
    render(PhoneInput, { props: { country: "US" } });

    expect(screen.getByLabelText("Phone number")).toBe(number());
    expect(screen.getByLabelText("Country calling code")).toBe(
      screen.getByRole("combobox"),
    );
  });

  it("fills the country from the locale when asked", async () => {
    render(PhoneInput, { props: { detect: true } });
    await tick();

    expect(text("country")).toBe("US");
  });
});
