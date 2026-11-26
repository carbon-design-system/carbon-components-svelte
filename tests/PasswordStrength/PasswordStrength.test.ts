import { render, screen } from "@testing-library/svelte";
import PasswordStrength from "./PasswordStrength.test.svelte";

const meter = () => screen.getByRole("meter");
const status = () => screen.getByRole("status");

describe("PasswordStrength", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("meter", () => {
    it("is a labelled meter whose value text names the level", () => {
      render(PasswordStrength, { value: "password" });

      expect(meter()).toHaveAccessibleName("Password strength");
      expect(meter()).toHaveAttribute("aria-valuemin", "0");
      expect(meter()).toHaveAttribute("aria-valuemax", "4");
      expect(meter()).toHaveAttribute("aria-valuenow", "1");
      expect(meter()).toHaveAttribute("aria-valuetext", "Strength: Weak");
    });

    it("has no filled segment and says so when empty", () => {
      const { container } = render(PasswordStrength, { value: "" });

      expect(meter()).toHaveAttribute("aria-valuenow", "0");
      expect(meter()).toHaveAttribute("aria-valuetext", "Strength: None");
      expect(
        container.querySelectorAll(".bx--password-strength__segment--filled"),
      ).toHaveLength(0);
      expect(
        container.querySelector(".bx--password-strength__level"),
      ).toBeNull();
    });

    it.each([
      ["password", "weak", 1],
      ["xK9#mQ2$vL7!pR4&", "strong", 4],
    ])("fills one segment per level for %s", (value, level, filled) => {
      const { container } = render(PasswordStrength, { value });

      expect(
        container.querySelector(`.bx--password-strength--${level}`),
      ).not.toBeNull();
      expect(
        container.querySelectorAll(".bx--password-strength__segment--filled"),
      ).toHaveLength(filled);
      expect(meter()).toHaveAttribute("aria-valuenow", String(filled));
    });

    it("follows the value", async () => {
      const { rerender } = render(PasswordStrength, { value: "password" });
      expect(meter()).toHaveAttribute("aria-valuenow", "1");

      await rerender({ value: "xK9#mQ2$vL7!pR4&" });
      expect(meter()).toHaveAttribute("aria-valuenow", "4");
    });

    it("shows the level word beside the label", () => {
      const { container } = render(PasswordStrength, { value: "password" });

      expect(
        container.querySelector(".bx--password-strength__level"),
      ).toHaveTextContent("Weak");
    });

    it("takes texts for another language", () => {
      render(PasswordStrength, {
        value: "password",
        levelTexts: { weak: "Faible" },
        valueText: (level: string) => `Robustesse : ${level}`,
      });

      expect(meter()).toHaveAttribute("aria-valuetext", "Robustesse : Faible");
    });

    it("never writes the password to the page", () => {
      const password = "Zebra-Quokka-8841!";
      const { container } = render(PasswordStrength, {
        value: password,
        userInputs: ["quokka@example.com"],
      });

      expect(container.ownerDocument.body.innerHTML).not.toContain("Zebra");
      expect(container.ownerDocument.body.innerHTML).not.toContain("8841");
    });
  });

  describe("feedback", () => {
    it("shows a warning and suggestions for a weak password", () => {
      render(PasswordStrength, { value: "password" });

      expect(
        screen.getByText("This is a top-10 common password."),
      ).toBeVisible();
      expect(
        screen.getByText("Add another word or two. Uncommon words are better."),
      ).toBeVisible();
    });

    it("describes the meter with the feedback", () => {
      render(PasswordStrength, { value: "password" });

      const id = meter().getAttribute("aria-describedby");
      expect(id).toBeTruthy();
      expect(document.getElementById(id as string)).toHaveTextContent(
        "top-10 common password",
      );
    });

    it("shows none for a strong password", () => {
      const { container } = render(PasswordStrength, {
        value: "xK9#mQ2$vL7!pR4&",
      });

      expect(
        container.querySelector(".bx--password-strength__feedback"),
      ).toBeNull();
      expect(meter()).not.toHaveAttribute("aria-describedby");
    });

    it("hides it with showFeedback={false}", () => {
      const { container } = render(PasswordStrength, {
        value: "password",
        showFeedback: false,
      });

      expect(
        container.querySelector(".bx--password-strength__feedback"),
      ).toBeNull();
    });

    it("names the user's own words", () => {
      render(PasswordStrength, {
        value: "AliceSmith1990x",
        userInputs: ["alice@example.com"],
      });

      expect(
        screen.getByText("Names and email addresses are easy to guess."),
      ).toBeVisible();
    });

    it("takes overridden feedback text", () => {
      render(PasswordStrength, {
        value: "password",
        feedbackTexts: { top10: "Tres commun." },
      });

      expect(screen.getByText("Tres commun.")).toBeVisible();
    });
  });

  describe("announcements", () => {
    it("is quiet for the value it mounts with", async () => {
      vi.useFakeTimers();
      render(PasswordStrength, { value: "password" });
      await vi.advanceTimersByTimeAsync(5000);

      expect(status()).toHaveTextContent("");
    });

    it("waits for typing to pause, then says the level and why", async () => {
      vi.useFakeTimers();
      const { rerender } = render(PasswordStrength, { value: "" });

      await rerender({ value: "p" });
      await vi.advanceTimersByTimeAsync(500);
      await rerender({ value: "pa" });
      await vi.advanceTimersByTimeAsync(500);
      await rerender({ value: "pass" });
      await vi.advanceTimersByTimeAsync(999);
      expect(status()).toHaveTextContent("");

      await vi.advanceTimersByTimeAsync(1);
      expect(status()).toHaveTextContent(
        "Strength: Weak. This is a top-100 common password.",
      );
    });

    it("says it at once on flush, for blur", async () => {
      vi.useFakeTimers();
      const { component, rerender } = render(PasswordStrength, { value: "" });
      await rerender({ value: "xK9#mQ2$vL7!pR4&" });

      (component as unknown as { flush(): void }).flush();
      await vi.advanceTimersByTimeAsync(0);
      expect(status()).toHaveTextContent("Strength: Strong");
    });

    it("clears when the field is emptied", async () => {
      vi.useFakeTimers();
      const { rerender } = render(PasswordStrength, { value: "" });
      await rerender({ value: "xK9#mQ2$vL7!pR4&" });
      await vi.advanceTimersByTimeAsync(1000);
      expect(status()).toHaveTextContent("Strength: Strong");

      await rerender({ value: "" });
      expect(status()).toHaveTextContent("");
    });

    it("keeps the status outside the element a described-by points to", () => {
      const { container } = render(PasswordStrength, { value: "password" });
      const root = container.querySelector(".bx--password-strength");

      expect(root).not.toContainElement(status());
    });
  });

  describe("change event", () => {
    it("fires when the level changes and not when only the score does", async () => {
      const onchange = vi.fn();
      const { rerender } = render(PasswordStrength, { value: "", onchange });

      await rerender({ value: "p" });
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange).toHaveBeenLastCalledWith({
        level: "weak",
        score: 0,
        previousLevel: "empty",
      });

      await rerender({ value: "pa" });
      expect(onchange).toHaveBeenCalledTimes(1);

      await rerender({ value: "xK9#mQ2$vL7!pR4&" });
      expect(onchange).toHaveBeenCalledTimes(2);
      expect(onchange).toHaveBeenLastCalledWith({
        level: "strong",
        score: 4,
        previousLevel: "weak",
      });
    });
  });

  describe("custom estimate", () => {
    it("uses a zxcvbn-shaped result, with feedback text as given", async () => {
      const estimate = vi.fn(() =>
        Promise.resolve({
          score: 3,
          feedback: { warning: "Server says hmm", suggestions: ["Try more"] },
        }),
      );
      render(PasswordStrength, { value: "anything", estimate });

      await vi.waitFor(() =>
        expect(meter()).toHaveAttribute("aria-valuetext", "Strength: Good"),
      );
      expect(screen.getByText("Server says hmm")).toBeVisible();
      expect(screen.getByText("Try more")).toBeVisible();
      expect(estimate).toHaveBeenCalledWith(
        "anything",
        expect.objectContaining({ userInputs: [] }),
      );
    });

    it("does not call it for an empty value", async () => {
      const estimate = vi.fn(() => Promise.resolve({ score: 4 }));
      render(PasswordStrength, { value: "", estimate });

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(estimate).not.toHaveBeenCalled();
      expect(meter()).toHaveAttribute("aria-valuenow", "0");
    });

    it("drops a result that arrives after the password changed again", async () => {
      const resolvers: Record<string, (score: number) => void> = {};
      const estimate = vi.fn(
        (password: string) =>
          new Promise<{ score: number }>((resolve) => {
            resolvers[password] = (score) => resolve({ score });
          }),
      );
      const { rerender } = render(PasswordStrength, {
        value: "first",
        estimate,
      });
      await vi.waitFor(() =>
        expect(estimate).toHaveBeenCalledWith("first", expect.anything()),
      );
      expect(meter()).toHaveAttribute("aria-busy", "true");

      await rerender({ value: "second" });
      await vi.waitFor(() =>
        expect(estimate).toHaveBeenCalledWith("second", expect.anything()),
      );

      resolvers.second(4);
      await vi.waitFor(() =>
        expect(meter()).toHaveAttribute("aria-valuenow", "4"),
      );
      expect(meter()).not.toHaveAttribute("aria-busy");

      resolvers.first(1);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(meter()).toHaveAttribute("aria-valuenow", "4");
    });

    it("aborts the signal of a superseded call", async () => {
      const signals: AbortSignal[] = [];
      const estimate = vi.fn(
        (_password: string, context: { signal: AbortSignal }) => {
          signals.push(context.signal);
          return new Promise<{ score: number }>(() => {});
        },
      );
      const { rerender } = render(PasswordStrength, {
        value: "first",
        estimate,
      });
      await vi.waitFor(() => expect(signals).toHaveLength(1));

      await rerender({ value: "second" });
      await vi.waitFor(() => expect(signals).toHaveLength(2));
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);
    });

    it("falls back to the built-in estimate and dispatches error when it throws", async () => {
      const failure = new Error("offline");
      const onerror = vi.fn();
      render(PasswordStrength, {
        value: "password",
        estimate: () => Promise.reject(failure),
        onerror,
      });

      await vi.waitFor(() => expect(onerror).toHaveBeenCalledWith(failure));
      expect(meter()).toHaveAttribute("aria-valuetext", "Strength: Weak");
      expect(meter()).not.toHaveAttribute("aria-busy");
    });
  });
});
