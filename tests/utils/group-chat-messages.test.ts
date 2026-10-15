import { groupChatMessages } from "../../src/utils/group-chat-messages.js";

const at = (iso: string) => new Date(iso);
const now = at("2026-10-19T18:00:00");

const summary = (items: ReturnType<typeof groupChatMessages>) =>
  items.map((item) =>
    item.type === "divider"
      ? `— ${item.label}`
      : `${item.message.author}${item.continued ? " +" : ""}${item.last ? " ·" : ""}`,
  );

describe("groupChatMessages", () => {
  it("groups one author's run, and ends the group after a gap or another author", () => {
    const items = groupChatMessages(
      [
        { author: "Sam", time: at("2026-10-19T09:00:00") },
        { author: "Sam", time: at("2026-10-19T09:02:00") },
        // Seven minutes later: past the five-minute group gap.
        { author: "Sam", time: at("2026-10-19T09:09:00") },
        { author: "You", time: at("2026-10-19T09:10:00") },
      ],
      { now, locale: "en-US" },
    );

    expect(summary(items)).toEqual([
      "— Today",
      "Sam",
      "Sam + ·",
      "Sam ·",
      "You ·",
    ]);
  });

  it("adds dividers for a new day and for a pause over an hour", () => {
    const items = groupChatMessages(
      [
        { author: "Sam", time: at("2026-10-17T16:00:00") },
        { author: "Sam", time: at("2026-10-18T10:00:00") },
        { author: "Sam", time: at("2026-10-18T10:01:00") },
        { author: "Sam", time: at("2026-10-18T14:30:00") },
      ],
      { now, locale: "en-US" },
    );

    expect(summary(items)).toEqual([
      "— Oct 17, 2026",
      "Sam ·",
      "— Yesterday",
      "Sam",
      "Sam + ·",
      "— 2:30 PM",
      "Sam ·",
    ]);
  });

  it("takes custom gaps, authors and labels", () => {
    const items = groupChatMessages(
      [
        { from: "them", time: 0 },
        { from: "them", time: 30_000 },
      ],
      { groupGap: 10_000, label: () => "Earlier" },
    );

    expect(
      items.map((item) =>
        item.type === "divider" ? item.label : item.continued,
      ),
    ).toEqual(["Earlier", false, false]);
  });
});
