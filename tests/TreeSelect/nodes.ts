export type Place = {
  id: string;
  text: string;
  disabled?: boolean;
  nodes?: Place[];
};

export const tree: Place[] = [
  {
    id: "eu",
    text: "Europe",
    nodes: [
      {
        id: "de",
        text: "Germany",
        nodes: [
          { id: "berlin", text: "Berlin" },
          { id: "munich", text: "Munich" },
        ],
      },
      { id: "fr", text: "France", nodes: [{ id: "paris", text: "Paris" }] },
    ],
  },
  {
    id: "na",
    text: "North America",
    nodes: [
      { id: "us", text: "United States" },
      { id: "ca", text: "Canada", disabled: true },
    ],
  },
  { id: "an", text: "Antarctica" },
];
