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

  it("ignores clicks while readonly", async () => {
    const onCheck = vi.fn();
    render(CheckboxForm, { props: { readonly: true, onCheck } });

    const checkbox = screen.getByRole("checkbox", { name: "Agree" });
    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(onCheck).not.toHaveBeenCalled();
  });
});
