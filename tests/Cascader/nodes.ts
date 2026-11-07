export type Place = {
  id: string;
  text: string;
  disabled?: boolean;
  hasChildren?: boolean;
  nodes?: Place[];
};

export const places: Place[] = [
  {
    id: "eu",
    text: "Europe",
    nodes: [
      {
        id: "fr",
        text: "France",
        nodes: [
          { id: "paris", text: "Paris" },
          { id: "lyon", text: "Lyon" },
        ],
      },
      {
        id: "de",
        text: "Germany",
        nodes: [
          { id: "berlin", text: "Berlin" },
          { id: "paris", text: "Paris, Texas?" },
        ],
      },
    ],
  },
  {
    id: "as",
    text: "Asia",
    nodes: [
      {
        id: "jp",
        text: "Japan",
        nodes: [
          { id: "tokyo", text: "Tokyo" },
          { id: "osaka", text: "Osaka", disabled: true },
        ],
      },
    ],
  },
  { id: "an", text: "Antarctica" },
];
