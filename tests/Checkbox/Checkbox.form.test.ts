import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import CheckboxForm from "./Checkbox.form.test.svelte";
import CheckboxFormGroup from "./Checkbox.formGroup.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;

describe("Checkbox form participation", () => {
  describe("change after the DOM and state disagree", () => {
    it("keeps the first click after a form reset", async () => {
      const onCheck = vi.fn();
      render(CheckboxForm, { props: { checked: true, onCheck } });

      const checkbox = screen.getByRole("checkbox", { name: "Agree" });
      getForm().reset();
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(onCheck).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: true }),
      );
    });

    it("toggles normally when the DOM and state agree", async () => {
      const onCheck = vi.fn();
      render(CheckboxForm, { props: { onCheck } });

      const checkbox = screen.getByRole("checkbox", { name: "Agree" });
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(onCheck).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: true }),
      );

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(onCheck).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: false }),
      );
    });

    it("bind:group: keeps the value after a form reset and a re-check", async () => {
      render(CheckboxFormGroup, { props: { group: ["a"] } });

      const checkbox = screen.getByRole("checkbox", { name: "A" });
      getForm().reset();
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(screen.getByTestId("group")).toHaveTextContent("a");
    });

    it("CheckboxGroup: keeps the value after a form reset and a re-check", async () => {
      render(CheckboxFormGroup, {
        props: { mode: "checkbox-group", group: ["a"] },
      });

      const checkbox = screen.getByRole("checkbox", { name: "A" });
      getForm().reset();
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(screen.getByTestId("group")).toHaveTextContent("a");
    });
  });

  describe("submitted value", () => {
    it('submits "on" for a checked checkbox with no value', () => {
      render(CheckboxForm, { props: { checked: true } });

      expect(new FormData(getForm()).get("agree")).toBe("on");
    });

    it("omits an unchecked checkbox", () => {
      render(CheckboxForm, { props: { checked: false } });

      expect(new FormData(getForm()).has("agree")).toBe(false);
    });

    it("submits an explicit value", () => {
      render(CheckboxForm, { props: { checked: true, value: "yes" } });

      expect(new FormData(getForm()).get("agree")).toBe("yes");
    });

    it("submits a numeric 0 value as a string", () => {
      render(CheckboxForm, { props: { checked: true, value: 0 } });

      expect(new FormData(getForm()).get("agree")).toBe("0");
    });

    it("submits bind:group members by value", () => {
      render(CheckboxFormGroup, { props: { group: ["a"] } });

      expect(new FormData(getForm()).getAll("channel")).toEqual(["a"]);
    });
  });

  it("ignores clicks while readonly", async () => {
    const onCheck = vi.fn();
    render(CheckboxForm, { props: { readonly: true, onCheck } });

    const checkbox = screen.getByRole("checkbox", { name: "Agree" });
    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(onCheck).not.toHaveBeenCalled();
  });
});
