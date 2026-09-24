import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
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

  describe("form reset", () => {
    it("syncs checked to the cleared box without firing check", async () => {
      const onCheck = vi.fn();
      render(CheckboxForm, { props: { onCheck } });
      const checkbox = screen.getByRole("checkbox", { name: "Agree" });

      await user.click(checkbox);
      expect(screen.getByTestId("bound").textContent).toBe("true");
      onCheck.mockClear();

      getForm().reset();
      await flushFormReset();

      expect(checkbox).not.toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("false");
      expect(new FormData(getForm()).has("agree")).toBe(false);
      expect(onCheck).not.toHaveBeenCalled();
    });

    it("follows the box's default state, as with server-rendered markup", async () => {
      render(CheckboxForm, { props: { checked: true } });
      const checkbox = screen.getByRole("checkbox", {
        name: "Agree",
      }) as HTMLInputElement;
      // Server-rendered markup carries the state as the `checked` attribute.
      checkbox.defaultChecked = true;

      await user.click(checkbox);
      expect(screen.getByTestId("bound").textContent).toBe("false");

      getForm().reset();
      await flushFormReset();

      expect(checkbox).toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("true");
    });

    it("keeps a read-only checkbox's state", async () => {
      render(CheckboxForm, { props: { checked: true, readonly: true } });
      const checkbox = screen.getByRole("checkbox", { name: "Agree" });

      getForm().reset();
      await flushFormReset();

      expect(checkbox).toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("true");
    });

    it("leaves the state alone when the reset is canceled", async () => {
      render(CheckboxForm);
      const checkbox = screen.getByRole("checkbox", { name: "Agree" });
      getForm().addEventListener("reset", (event) => event.preventDefault());

      await user.click(checkbox);
      getForm().reset();
      await flushFormReset();

      expect(checkbox).toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("true");
    });

    it("bind:group: removes the values of cleared boxes", async () => {
      render(CheckboxFormGroup, { props: { group: [] } });

      await user.click(screen.getByRole("checkbox", { name: "A" }));
      await user.click(screen.getByRole("checkbox", { name: "B" }));
      expect(screen.getByTestId("group").textContent).toBe("a,b");

      getForm().reset();
      await flushFormReset();

      expect(screen.getByTestId("group").textContent).toBe("");
    });

    it("CheckboxGroup: removes the values of cleared boxes", async () => {
      render(CheckboxFormGroup, {
        props: { mode: "checkbox-group", group: [] },
      });

      await user.click(screen.getByRole("checkbox", { name: "A" }));
      await user.click(screen.getByRole("checkbox", { name: "B" }));
      expect(screen.getByTestId("group").textContent).toBe("a,b");

      getForm().reset();
      await flushFormReset();

      expect(screen.getByTestId("group").textContent).toBe("");
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
