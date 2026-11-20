import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { stubIntersectionObserver } from "../utils/intersection-observer-mock";
import { user } from "../utils/user";
import ActivityFeed from "./ActivityFeed.test.svelte";

const feedOf = () => screen.getByRole("feed", { name: "Activity" });
const articles = () => within(feedOf()).getAllByRole("article");

describe("ActivityFeed", () => {
  beforeEach(() => localStorage.clear());

  it("is a named feed of articles that know their place", () => {
    render(ActivityFeed);

    // Two events share an article, then two comments.
    expect(articles()).toHaveLength(3);
    const [events, comment, second] = articles();
    expect(events).toHaveAttribute("aria-posinset", "1");
    expect(second).toHaveAttribute("aria-setsize", "3");
    expect(events).toHaveAccessibleName(
      "Activity by Grace Hopper, Mar 1, 2026, 9:00 AM",
    );
    expect(comment).toHaveAccessibleName(
      "Comment by Grace Hopper, Mar 1, 2026, 10:00 AM",
    );
    expect(comment).toHaveAttribute("tabindex", "0");
    expect(feedOf()).toHaveAttribute("aria-busy", "false");
  });

  it("draws one divider per day, hidden from assistive technology", () => {
    render(ActivityFeed);

    const dividers = feedOf().querySelectorAll(".bx--chat-divider");
    expect(dividers).toHaveLength(2);
    expect(dividers[0]).toHaveAttribute("aria-hidden", "true");
    expect(dividers[0]).toHaveTextContent("Yesterday");
    expect(dividers[1]).toHaveTextContent("Today");
  });

  it("renders a body as elements and never as HTML", () => {
    render(ActivityFeed, {
      items: [
        {
          id: "x",
          kind: "comment",
          author: { id: "alan", name: "Alan" },
          createdAt: Date.parse("2026-03-02T08:00:00Z"),
          body: '<img src=x onerror="window.__x=1"> [bad](javascript:alert(1)) @[Grace](grace)',
        },
      ],
    });

    const body = feedOf().querySelector(".bx--activity-body") as HTMLElement;
    expect(body.querySelector("img")).toBeNull();
    expect(body.querySelector("a")).toBeNull();
    expect(body).toHaveTextContent(
      '<img src=x onerror="window.__x=1"> [bad](javascript:alert(1)) @Grace',
    );
  });

  it("links a URL in the body safely", () => {
    render(ActivityFeed);

    const link = screen.getByRole("link", {
      name: "https://example.com/issue",
    });
    expect(link).toHaveAttribute("rel", "noopener noreferrer ugc");
  });

  it("marks an edit and says when in its tooltip", async () => {
    render(ActivityFeed);

    const mark = screen.getByRole("button", { name: "edited" });
    expect(screen.queryByText("Edited Mar 1, 2026, 10:30 AM")).toBeNull();
    mark.focus();
    expect(
      await screen.findByText("Edited Mar 1, 2026, 10:30 AM"),
    ).toBeInTheDocument();
  });

  describe("reactions", () => {
    it("is a toggle with the count and the people in its name", () => {
      render(ActivityFeed);

      const button = screen.getByRole("button", {
        name: "Thumbs up, 2 reactions: You and Alan Turing",
      });
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("adds at once and takes the add back when the request fails", async () => {
      let fail = false;
      render(ActivityFeed, {
        onReact: async () => {
          await tick();
          if (fail) throw new Error("offline");
        },
      });
      await user.click(
        within(articles()[2]).getByRole("button", { name: "Add reaction" }),
      );
      fail = true;
      await user.click(screen.getByRole("menuitem", { name: /Hooray/ }));

      await waitFor(() =>
        expect(screen.getByText(/reaction was not saved/)).toBeInTheDocument(),
      );
      expect(
        within(articles()[2]).queryByRole("button", { name: /Hooray/ }),
      ).toBeNull();

      await user.click(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByText(/reaction was not saved/)).toBeNull();
    });

    it("withdraws your own reaction", async () => {
      const onReact = vi.fn(async () => {});
      render(ActivityFeed, { onReact });
      await user.click(
        screen.getByRole("button", { name: /Thumbs up, 2 reactions/ }),
      );

      expect(onReact).toHaveBeenCalledWith("c1", "\u{1F44D}", false);
      expect(
        screen.getByRole("button", {
          name: "Thumbs up, 1 reaction: Alan Turing",
        }),
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("replies", () => {
    it("folds earlier replies of a long thread and opens them again", async () => {
      render(ActivityFeed);

      const thread = within(articles()[1]);
      expect(thread.getAllByRole("listitem")).toHaveLength(2);
      const toggle = thread.getByRole("button", {
        name: "Show 2 earlier replies",
      });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      await user.click(toggle);
      expect(thread.getAllByRole("listitem")).toHaveLength(4);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(toggle).toHaveFocus();
      expect(toggle).toHaveTextContent("Hide earlier replies");
    });

    it("keeps a reply on the comment it belongs to, in one level", async () => {
      const onAdd = vi.fn(async (draft: { body: string }) => ({
        id: "reply-saved",
        kind: "comment" as const,
        author: { id: "ada", name: "Ada Lovelace" },
        createdAt: Date.parse("2026-03-02T09:30:00Z"),
        body: draft.body,
        parentId: "c1",
      }));
      render(ActivityFeed, { onAdd });

      await user.click(
        within(articles()[1]).getByRole("button", { name: "Reply" }),
      );
      const field = screen.getByRole("textbox", {
        name: "Reply to Grace Hopper",
      });
      expect(field).toHaveFocus();
      await user.type(field, "On it");
      await user.keyboard("{Control>}{Enter}{/Control}");

      await waitFor(() =>
        expect(onAdd).toHaveBeenCalledWith(
          expect.objectContaining({ body: "On it", parentId: "c1" }),
        ),
      );
      expect(articles()).toHaveLength(3);
      expect(within(articles()[1]).getByText("On it")).toBeInTheDocument();
    });
  });

  describe("composer", () => {
    it("submits on mod+Enter and lets plain Enter write a new line", async () => {
      const onAdd = vi.fn(async (draft: { body: string }) => ({
        id: "new",
        kind: "comment" as const,
        author: { id: "ada", name: "Ada Lovelace" },
        createdAt: Date.parse("2026-03-02T09:30:00Z"),
        body: draft.body,
      }));
      render(ActivityFeed, { onAdd });
      const field = screen.getByRole("textbox", { name: "Comment" });

      await user.type(field, "one{Enter}two");
      expect(onAdd).not.toHaveBeenCalled();
      await user.keyboard("{Control>}{Enter}{/Control}");

      await waitFor(() =>
        expect(onAdd).toHaveBeenCalledWith(
          expect.objectContaining({ body: "one\ntwo" }),
        ),
      );
      expect(field).toHaveValue("");
      expect(field).toHaveFocus();
    });

    it("ignores mod+Enter while the field is empty", async () => {
      const onAdd = vi.fn();
      render(ActivityFeed, { onAdd });
      await user.type(screen.getByRole("textbox", { name: "Comment" }), "   ");
      await user.keyboard("{Control>}{Enter}{/Control}");

      expect(onAdd).not.toHaveBeenCalled();
    });

    it("keeps a draft per thread across a remount, and drops it when sent", async () => {
      const first = render(ActivityFeed, { draftKey: "thread-1" });
      await user.type(
        screen.getByRole("textbox", { name: "Comment" }),
        "half a th",
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(localStorage.getItem("thread-1:new")).toBe("half a th");
      first.unmount();

      render(ActivityFeed, { draftKey: "thread-1" });
      await waitFor(() =>
        expect(screen.getByRole("textbox", { name: "Comment" })).toHaveValue(
          "half a th",
        ),
      );
      await user.click(screen.getByRole("textbox", { name: "Comment" }));
      await user.keyboard("{Control>}{Enter}{/Control}");
      await waitFor(() =>
        expect(localStorage.getItem("thread-1:new")).toBeNull(),
      );
    });

    it("leaves no empty draft behind in storage", async () => {
      render(ActivityFeed, { draftKey: "thread-2" });
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(localStorage.getItem("thread-2:new")).toBeNull();
    });
  });

  describe("edit and delete", () => {
    it("edits your own comment in place and returns focus to its menu", async () => {
      const onEdit = vi.fn(async () => {});
      render(ActivityFeed, { onEdit });
      const own = within(articles()[2]);

      await user.click(own.getByRole("button", { name: "Comment options" }));
      await user.click(screen.getByRole("menuitem", { name: "Edit" }));
      const editor = own.getByRole("textbox", { name: "Edit" });
      expect(editor).toHaveFocus();
      expect(editor).toHaveValue(
        "Thanks, @[Grace Hopper](grace). I will take a look.",
      );

      await user.clear(editor);
      await user.type(editor, "Changed");
      await user.keyboard("{Control>}{Enter}{/Control}");

      expect(onEdit).toHaveBeenCalledWith("c2", "Changed");
      expect(own.getByText("Changed")).toBeInTheDocument();
      expect(own.getByText("edited")).toBeInTheDocument();
      await waitFor(() =>
        expect(
          own.getByRole("button", { name: "Comment options" }),
        ).toHaveFocus(),
      );
    });

    it("cancels an edit with Escape and leaves the comment alone", async () => {
      render(ActivityFeed);
      const own = within(articles()[2]);

      await user.click(own.getByRole("button", { name: "Comment options" }));
      await user.click(screen.getByRole("menuitem", { name: "Edit" }));
      await user.type(own.getByRole("textbox", { name: "Edit" }), " more");
      await user.keyboard("{Escape}");

      expect(own.queryByRole("textbox")).toBeNull();
      expect(own.getByText(/I will take a look/)).toBeInTheDocument();
    });

    it("offers edit and delete only on your own comments", () => {
      render(ActivityFeed);

      const others = articles()[1].querySelector(
        ".bx--activity-comment",
      ) as HTMLElement;
      expect(
        within(others).queryByRole("button", { name: "Comment options" }),
      ).toBeNull();
      expect(
        within(articles()[2]).getByRole("button", { name: "Comment options" }),
      ).toBeInTheDocument();
    });

    it("asks before it deletes, and restores the comment if that fails", async () => {
      render(ActivityFeed, {
        onDelete: () => Promise.reject(new Error("forbidden")),
      });
      const own = within(articles()[2]);
      await user.click(own.getByRole("button", { name: "Comment options" }));
      await user.click(screen.getByRole("menuitem", { name: "Delete" }));

      expect(
        screen.getByRole("group", { name: "Delete this comment?" }),
      ).toBeVisible();
      expect(own.getByRole("button", { name: "Cancel" })).toHaveFocus();

      await user.click(own.getByRole("button", { name: "Delete" }));
      await waitFor(() =>
        expect(
          screen.getByText("The comment was not deleted."),
        ).toBeInTheDocument(),
      );
      expect(articles()).toHaveLength(3);
    });
  });

  describe("older activity", () => {
    it("loads older comments above and moves focus to the first of them", async () => {
      render(ActivityFeed, { hasOlder: true });
      expect(articles()[0]).toHaveAttribute("aria-setsize", "-1");

      await user.click(
        screen.getByRole("button", { name: "Load older activity" }),
      );

      await waitFor(() => expect(articles()).toHaveLength(4));
      expect(
        within(articles()[0]).getByText("An older comment"),
      ).toBeInTheDocument();
      await waitFor(() => expect(articles()[0]).toHaveFocus());
      expect(
        screen.queryByRole("button", { name: "Load older activity" }),
      ).toBeNull();
      expect(articles()[0]).toHaveAttribute("aria-setsize", "4");
    });
  });

  describe("keyboard", () => {
    it("moves between articles with PageDown and PageUp", async () => {
      render(ActivityFeed);
      articles()[0].focus();

      await user.keyboard("{PageDown}");
      expect(articles()[1]).toHaveFocus();
      await user.keyboard("{PageDown}{PageUp}");
      expect(articles()[1]).toHaveFocus();
    });

    it("leaves PageDown to a text field", async () => {
      render(ActivityFeed);
      await user.click(
        within(articles()[1]).getByRole("button", { name: "Reply" }),
      );
      const field = screen.getByRole("textbox", {
        name: "Reply to Grace Hopper",
      });
      await user.keyboard("{PageDown}");

      expect(field).toHaveFocus();
    });
  });

  describe("incoming items", () => {
    it("shows a count while the reader is above the end and clears it at the end", async () => {
      const { instances } = stubIntersectionObserver();
      const { component } = render(ActivityFeed);
      const end = feedOf()
        .closest(".bx--activity-feed")
        ?.querySelector(".bx--activity-feed__end") as HTMLElement;
      const observer = instances.find((instance) => instance.elements.has(end));
      observer?.trigger(end, false);
      await tick();

      component.feed.receive([
        {
          id: "in1",
          kind: "comment",
          author: { id: "alan", name: "Alan Turing" },
          createdAt: Date.parse("2026-03-02T11:00:00Z"),
          body: "Late news",
        },
      ]);
      const button = await screen.findByRole("button", {
        name: "1 new comment",
      });

      expect(screen.getByRole("status")).toHaveTextContent(
        "Alan Turing commented",
      );
      observer?.trigger(end, true);
      await waitFor(() => expect(button).not.toBeInTheDocument());
    });

    it("does not count older items as new", async () => {
      const { instances } = stubIntersectionObserver();
      const { component } = render(ActivityFeed);
      const end = feedOf()
        .closest(".bx--activity-feed")
        ?.querySelector(".bx--activity-feed__end") as HTMLElement;
      instances
        .find((instance) => instance.elements.has(end))
        ?.trigger(end, false);
      await tick();

      component.feed.receive([
        {
          id: "old",
          kind: "comment",
          author: { id: "alan", name: "Alan Turing" },
          createdAt: Date.parse("2026-01-01T11:00:00Z"),
          body: "Ancient",
        },
      ]);
      await tick();

      expect(screen.queryByRole("button", { name: /new comment/ })).toBeNull();
    });
  });
});
