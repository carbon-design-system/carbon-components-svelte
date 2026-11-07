import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { tick } from "svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import SignaturePadForm from "./SignaturePad.form.test.svelte";
import SignaturePad from "./SignaturePad.test.svelte";
import { drawStroke, getPad, signed, wave } from "./helpers";

describe("SignaturePad", () => {
  describe("drawing", () => {
    it("names an empty pad and says what to do", () => {
      render(SignaturePad);

      expect(getPad()).toHaveAccessibleName(
        "Signature pad, draw your signature",
      );
      expect(getPad()).toHaveAccessibleDescription(/Type tab/);
      expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    });

    it("captures a stroke as SVG and tells assistive technology", async () => {
      const { component } = render(SignaturePad);

      await drawStroke(getPad(), wave);

      expect(getPad()).toHaveAccessibleName("Signature captured");
      expect(screen.getByRole("status")).toHaveTextContent(
        "Signature captured",
      );
      expect(screen.getByTestId("value")).toHaveTextContent("drawn");
      const { type, svg } = signed(component);
      expect(type).toBe("drawn");
      expect(svg).toContain('viewBox="0 0 600 200"');
      expect(svg).toContain("<path");
      expect(component.changes).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    });

    it("maps pointer coordinates into the pad's own units", async () => {
      const { component } = render(SignaturePad);
      const pad = getPad();
      // Shown at half size: a point at 150 is 300 of the pad's 600.
      pad.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 300, height: 100 }) as DOMRect;

      await drawStroke(pad, [[150, 50]]);

      // A dot is a circle centred on the point, so it starts left of 300.
      expect(signed(component).svg).toMatch(/M29[0-9.]* 100a/);
    });

    it("reads the coalesced samples of a fast stroke", async () => {
      const { component } = render(SignaturePad);
      const pad = getPad();
      const base = { pointerId: 1, button: 0, pointerType: "pen" };
      const at = (clientX: number, clientY: number) =>
        new PointerEvent("pointermove", { ...base, clientX, clientY });
      // One event that stands for four samples, a zigzag. Read as a single
      // move to the last sample it would be a straight line.
      const move = at(300, 100);
      move.getCoalescedEvents = () => [
        at(100, 20),
        at(180, 160),
        at(260, 20),
        at(300, 100),
      ];

      pad.dispatchEvent(
        new PointerEvent("pointerdown", { ...base, clientX: 20, clientY: 100 }),
      );
      pad.dispatchEvent(move);
      pad.dispatchEvent(
        new PointerEvent("pointerup", { ...base, clientX: 300, clientY: 100 }),
      );
      await tick();

      expect(signed(component).svg?.match(/Q/g)?.length).toBeGreaterThan(0);
    });

    it("removes the last stroke with Undo, and Ctrl+Z on a button", async () => {
      const { component } = render(SignaturePad);
      await drawStroke(getPad(), wave);
      await drawStroke(
        getPad(),
        wave.map(([x, y]) => [x, y + 20]),
      );
      expect(signed(component).svg?.match(/<path /g)).toHaveLength(2);

      await user.click(screen.getByRole("button", { name: "Undo" }));
      expect(signed(component).svg?.match(/<path /g)).toHaveLength(1);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Last stroke removed",
      );

      screen.getByRole("button", { name: "Clear" }).focus();
      await user.keyboard("{Control>}z{/Control}");

      expect(component.value).toBeNull();
      expect(getPad()).toHaveAccessibleName(
        "Signature pad, draw your signature",
      );
      expect(screen.getByRole("status")).toHaveTextContent("Signature cleared");
    });

    it("clears every stroke at once", async () => {
      const { component } = render(SignaturePad);
      await drawStroke(getPad(), wave);
      await drawStroke(getPad(), wave);

      await user.click(screen.getByRole("button", { name: "Clear" }));

      expect(component.value).toBeNull();
      expect(component.changes.at(-1)).toBeNull();
    });

    it("drops a stroke the browser cancelled", async () => {
      const { component } = render(SignaturePad);

      await drawStroke(getPad(), wave, {}, "pointercancel");

      expect(component.value).toBeNull();
      expect(component.changes).toEqual([]);
    });

    it("ignores the pointer when disabled or read-only", async () => {
      const { component, rerender } = render(SignaturePad, { disabled: true });
      await drawStroke(getPad(), wave);
      expect(component.value).toBeNull();

      await rerender({ disabled: false, readonly: true });
      await drawStroke(getPad(), wave);
      expect(component.value).toBeNull();
    });

    it("empties when value is set to null from outside", async () => {
      const { component, rerender } = render(SignaturePad);
      await drawStroke(getPad(), wave);
      expect(component.value).not.toBeNull();

      await rerender({ value: null });

      expect(getPad()).toHaveAccessibleName(
        "Signature pad, draw your signature",
      );
    });
  });

  describe("typing", () => {
    it("is the keyboard way to sign, and sets a typed value", async () => {
      const { component } = render(SignaturePad);

      await user.click(screen.getByRole("tab", { name: "Type" }));
      await user.type(screen.getByLabelText("Type your name"), "Ada Lovelace");

      expect(screen.getByTestId("mode")).toHaveTextContent("type");
      expect(signed(component).type).toBe("typed");
      expect(signed(component).text).toBe("Ada Lovelace");
      expect(signed(component).svg).toContain("Ada Lovelace</text>");
    });

    it("moves between tabs with the arrow keys", async () => {
      render(SignaturePad);

      screen.getByRole("tab", { name: "Draw" }).focus();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByLabelText("Type your name")).toBeVisible();
    });

    it("keeps each mode's work and reports the active mode's value", async () => {
      const { component } = render(SignaturePad);
      await drawStroke(getPad(), wave);
      await user.click(screen.getByRole("tab", { name: "Type" }));

      // Nothing typed yet, so there is no signature.
      expect(component.value).toBeNull();

      await user.type(screen.getByLabelText("Type your name"), "Ada");
      await user.click(screen.getByRole("tab", { name: "Draw" }));

      expect(signed(component).type).toBe("drawn");
    });

    it("treats spaces alone as empty", async () => {
      const { component } = render(SignaturePad, { mode: "type" });

      await user.type(screen.getByLabelText("Type your name"), "   ");

      expect(component.value).toBeNull();
    });
  });

  describe("modes", () => {
    it("shows one panel and no tabs for a single mode", () => {
      render(SignaturePad, { modes: ["type"] });

      expect(screen.getByLabelText("Type your name")).toBeVisible();
      expect(screen.queryByRole("tab", { name: "Draw" })).toBeNull();
    });

    it("offers an upload tab when asked", () => {
      render(SignaturePad, { modes: ["draw", "type", "upload"] });

      expect(screen.getByRole("tab", { name: "Upload" })).toBeInTheDocument();
    });

    it("rejects a file that is not an image", async () => {
      const { container } = render(SignaturePad, { modes: ["upload"] });
      const input =
        container.querySelector<HTMLInputElement>('input[type="file"]');
      assert(input);

      await userEvent
        .setup({ applyAccept: false })
        .upload(
          input,
          new File(["x"], "sign.pdf", { type: "application/pdf" }),
        );
      await flushFormReset();

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Choose a PNG, JPEG or WebP image under 5 MB.",
      );
    });
  });

  describe("states", () => {
    it("names the group by its label", () => {
      render(SignaturePad);

      expect(screen.getByRole("group", { name: "Signature" })).toBeVisible();
    });

    it("shows the required message when the form tries to submit", async () => {
      render(SignaturePadForm, { props: { required: true } });

      await user.click(screen.getByRole("button", { name: "Submit" }));

      expect(screen.getByRole("alert")).toHaveTextContent("Add your signature");
      expect(screen.getByRole("group")).toHaveAttribute("aria-invalid", "true");
    });

    it("moves the message to the text field while typing", () => {
      render(SignaturePad, {
        mode: "type",
        invalid: true,
        invalidText: "Sign",
      });

      const input = screen.getByLabelText("Type your name");
      expect(input).toHaveAttribute("data-invalid", "true");
      expect(screen.getAllByText("Sign")).toHaveLength(1);
    });
  });

  describe("form", () => {
    it("submits the value as JSON under name", async () => {
      render(SignaturePadForm);
      expect(new FormData(getForm()).get("signature")).toBe("");

      await drawStroke(getPad(), wave);

      const submitted = JSON.parse(
        String(new FormData(getForm()).get("signature")),
      );
      expect(submitted.type).toBe("drawn");
      expect(submitted.svg).toContain("<svg");
    });

    it("blocks a required form until there is a signature", async () => {
      render(SignaturePadForm, { props: { required: true } });
      expect(getForm().checkValidity()).toBe(false);

      await drawStroke(getPad(), wave);

      expect(getForm().checkValidity()).toBe(true);
    });

    it("clears on form reset", async () => {
      render(SignaturePadForm);
      await drawStroke(getPad(), wave);
      expect(getBoundText()).toBe("drawn");

      await resetForm();

      expect(getBoundText()).toBe("");
      expect(new FormData(getForm()).get("signature")).toBe("");
      expect(getPad()).toHaveAccessibleName(
        "Signature pad, draw your signature",
      );
    });
  });
});
