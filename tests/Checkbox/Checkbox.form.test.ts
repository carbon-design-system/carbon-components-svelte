import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import CheckboxForm from "./Checkbox.form.test.svelte";
import CheckboxFormGroup from "./Checkbox.formGroup.test.svelte";

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

    describe.each([
      ["bind:group", "bind-group"],
      ["CheckboxGroup", "checkbox-group"],
    ] as const)("%s", (_, mode) => {
      it("keeps the value after a form reset and a re-check", async () => {
        render(CheckboxFormGroup, { props: { mode, group: ["a"] } });

        const checkbox = screen.getByRole("checkbox", { name: "A" });
        getForm().reset();
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);

        expect(checkbox).toBeChecked();
        expect(screen.getByTestId("group")).toHaveTextContent("a");
      });
    });
  });

  describe("form reset", () => {
    it("syncs checked to the cleared box without firing check", async () => {
      const onCheck = vi.fn();
      render(CheckboxForm, { props: { onCheck } });
      const checkbox = screen.getByRole("checkbox", { name: "Agree" });

      await user.click(checkbox);
      expect(getBoundText()).toBe("true");
      onCheck.mockClear();

      await resetForm();

      expect(checkbox).not.toBeChecked();
      expect(getBoundText()).toBe("false");
      expect(new FormData(getForm()).has("agree")).toBe(false);
      expect(onCheck).not.toHaveBeenCalled();
    });

    it("follows the box's default state, as with server-rendered markup", async () => {
      render(CheckboxForm, { props: { checked: true } });
      const checkbox = screen.getByRole("checkbox", { name: "Agree" });
      assert(checkbox instanceof HTMLInputElement);
      // Server-rendered markup carries the state as the `checked` attribute.
      checkbox.defaultChecked = true;

      await user.click(checkbox);
      expect(getBoundText()).toBe("false");

      await resetForm();

      expect(checkbox).toBeChecked();
      expect(getBoundText()).toBe("true");
    });

    it("keeps a read-only checkbox's state", async () => {
      render(CheckboxForm, { props: { checked: true, readonly: true } });
      const checkbox = screen.getByRole("checkbox", { name: "Agree" });

      await resetForm();

      expect(checkbox).toBeChecked();
      expect(getBoundText()).toBe("true");
    });

    describe.each([
      ["bind:group", "bind-group"],
      ["CheckboxGroup", "checkbox-group"],
    ] as const)("%s", (_, mode) => {
      it("removes the values of cleared boxes", async () => {
        render(CheckboxFormGroup, { props: { mode, group: [] } });

        await user.click(screen.getByRole("checkbox", { name: "A" }));
        await user.click(screen.getByRole("checkbox", { name: "B" }));
        expect(screen.getByTestId("group").textContent).toBe("a,b");

        await resetForm();

        expect(screen.getByTestId("group").textContent).toBe("");
      });
    });

    it.each(["bind-group", "checkbox-group"] as const)(
      "%s: fires no events on a form reset",
      async (mode) => {
        const onCheck = vi.fn();
        const onChange = vi.fn();
        render(CheckboxFormGroup, { props: { mode, onCheck, onChange } });

        await user.click(screen.getByRole("checkbox", { name: "A" }));
        await user.click(screen.getByRole("checkbox", { name: "B" }));
        onCheck.mockClear();
        onChange.mockClear();

        await resetForm();

        expect(screen.getByTestId("group").textContent).toBe("");
        expect(onCheck).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
      },
    );
  });

  describe("submitted value", () => {
    it('submits "on" for a checked checkbox with no value', () => {
      render(CheckboxForm, { props: { checked: true } });

      expect(new FormData(getForm()).get("agree")).toBe("on");
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

  it("CheckboxGroup: one checked box satisfies required", async () => {
    render(CheckboxFormGroup, {
      props: { mode: "checkbox-group", required: true },
    });
    const checkbox = screen.getByRole("checkbox", { name: "A" });

    await user.click(checkbox);
    expect(getForm().checkValidity()).toBe(true);

    await user.click(checkbox);
    expect(getForm().checkValidity()).toBe(false);
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
