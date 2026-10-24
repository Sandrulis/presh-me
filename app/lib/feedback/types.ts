export type FeedbackKind = "bug" | "suggestion" | "feedback";

export type FeedbackEntry = {
  id: string;
  kind: FeedbackKind;
  accountId: string;
  email: string;
  name: string;
  title: string;
  body: string;
  rating: number | null;
  /** JPEG data URL priekšskati (kļūda / ieteikums). */
  images: string[];
  createdAt: string;
};

export type ContactEntry = {
  id: string;
  accountId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};
