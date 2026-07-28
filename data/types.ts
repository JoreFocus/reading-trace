export type ReadingRole = "core" | "support" | "turn";

export type MarkId =
  | "struck"
  | "resonate"
  | "partial"
  | "hold"
  | "challenge";

export type ReadingItem = {
  id: string;
  role: ReadingRole;
  quote: string;
  context: string;
  prompt: string;
};

export type ReadingGroup = {
  id: string;
  index: string;
  kicker: string;
  shortTitle: string;
  title: string;
  description: string;
  items: ReadingItem[];
};

export type ReadingDocument = {
  id: string;
  language: string;
  title: string;
  summary: string;
  thesis: string;
  invitation: string;
  source: {
    label: string;
    url: string;
    licenseNote: string;
  };
  roleLabels: Record<ReadingRole, string>;
  ui?: Record<string, string | string[]>;
  groups: ReadingGroup[];
};
