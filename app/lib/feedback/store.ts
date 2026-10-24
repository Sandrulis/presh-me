"use client";

import { createClient } from "@/app/lib/supabase/client";
import type { ContactEntry, FeedbackEntry, FeedbackKind } from "@/app/lib/feedback/types";

const listeners = new Set<() => void>();
let feedbackCache: FeedbackEntry[] = [];
let contactCache: ContactEntry[] = [];
let feedbackKey = "";
let contactKey = "";

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeFeedbackStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const FEEDBACK_IMAGE_MAX = 4;

function mapFeedback(row: {
  id: string;
  kind: FeedbackKind;
  account_id: string;
  email: string;
  name: string;
  title: string;
  body: string;
  rating: number | null;
  images: unknown;
  created_at: string;
}): FeedbackEntry {
  return {
    id: row.id,
    kind: row.kind,
    accountId: row.account_id,
    email: row.email,
    name: row.name,
    title: row.title,
    body: row.body,
    rating: row.rating,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    createdAt: row.created_at,
  };
}

function mapContact(row: {
  id: string;
  account_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}): ContactEntry {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function refreshFeedbackLists() {
  const supabase = createClient();
  const [feedbackRes, contactRes] = await Promise.all([
    supabase
      .from("user_feedback")
      .select("id, kind, account_id, email, name, title, body, rating, created_at")
      .order("created_at", { ascending: false })
      .range(0, 99),
    supabase
      .from("contact_messages")
      .select("id, account_id, name, email, subject, message, created_at")
      .order("created_at", { ascending: false })
      .range(0, 99),
  ]);
  if (!feedbackRes.error) {
    feedbackCache = (feedbackRes.data ?? []).map((row) =>
      mapFeedback({ ...(row as Omit<Parameters<typeof mapFeedback>[0], "images">), images: [] }),
    );
    feedbackKey = feedbackCache.map((item) => item.id).join("|");
  }
  if (!contactRes.error) {
    contactCache = (contactRes.data ?? []).map((row) => mapContact(row as Parameters<typeof mapContact>[0]));
    contactKey = contactCache.map((item) => item.id).join("|");
  }
  emit();
}

/** Load images only when opening a feedback row. */
export async function loadFeedbackImages(id: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase.from("user_feedback").select("images").eq("id", id).maybeSingle();
  const images = Array.isArray(data?.images) ? (data.images as string[]) : [];
  feedbackCache = feedbackCache.map((item) => (item.id === id ? { ...item, images } : item));
  emit();
  return images;
}

export function listFeedbackEntries(): FeedbackEntry[] {
  return feedbackCache;
}

export function listContactEntries(): ContactEntry[] {
  return contactCache;
}

export async function submitUserFeedback(input: {
  kind: FeedbackKind;
  accountId: string;
  email: string;
  name: string;
  title: string;
  body: string;
  rating?: number;
  images?: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.kind !== "bug" && input.kind !== "suggestion" && input.kind !== "feedback") {
    return { ok: false, error: "Nederīgs ziņojuma veids." };
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (input.kind !== "feedback" && title.length < 2) {
    return { ok: false, error: "Ievadi virsrakstu un aprakstu." };
  }
  if (body.length < 2) return { ok: false, error: "Ievadi aprakstu." };
  if (input.kind === "feedback") {
    const rating = input.rating ?? 0;
    if (rating < 1 || rating > 5) return { ok: false, error: "Izvēlies vērtējumu no 1 līdz 5." };
  }
  if (title.length > 200 || body.length > 8000) {
    return { ok: false, error: "Teksts ir pārāk garš." };
  }
  // Strip HTML-ish markup; keep plain text
  if (/<script|<iframe|javascript:/i.test(`${title}\n${body}`)) {
    return { ok: false, error: "Teksts satur neatļautu saturu." };
  }
  const allowImages = input.kind === "bug" || input.kind === "suggestion";
  const images = allowImages
    ? (input.images ?? [])
        .filter(
          (url) =>
            typeof url === "string" &&
            /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(url) &&
            !/^data:image\/svg/i.test(url) &&
            url.length <= 400_000,
        )
        .slice(0, FEEDBACK_IMAGE_MAX)
    : [];

  const supabase = createClient();
  const { error } = await supabase.from("user_feedback").insert({
    kind: input.kind,
    account_id: input.accountId,
    email: input.email.slice(0, 320),
    name: input.name.slice(0, 120),
    title: input.kind === "feedback" ? "" : title.slice(0, 200),
    body: body.slice(0, 8000),
    rating: input.kind === "feedback" ? (input.rating ?? null) : null,
    images,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitContactMessage(input: {
  accountId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 2 || message.length < 2) {
    return { ok: false, error: "Ievadi vārdu, e-pastu, tematu un ziņu." };
  }
  if (subject.length > 200 || message.length > 8000) {
    return { ok: false, error: "Teksts ir pārāk garš." };
  }
  if (/<script|<iframe|javascript:/i.test(`${subject}\n${message}`)) {
    return { ok: false, error: "Teksts satur neatļautu saturu." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("contact_messages").insert({
    account_id: input.accountId,
    name: name.slice(0, 120),
    email: email.slice(0, 320),
    subject: subject.slice(0, 200),
    message: message.slice(0, 8000),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFeedbackEntry(id: string) {
  const supabase = createClient();
  await supabase.from("user_feedback").delete().eq("id", id);
  feedbackCache = feedbackCache.filter((item) => item.id !== id);
  feedbackKey = feedbackCache.map((item) => item.id).join("|");
  emit();
  return feedbackCache;
}

export async function deleteContactEntry(id: string) {
  const supabase = createClient();
  await supabase.from("contact_messages").delete().eq("id", id);
  contactCache = contactCache.filter((item) => item.id !== id);
  contactKey = contactCache.map((item) => item.id).join("|");
  emit();
  return contactCache;
}

// silence unused in snap helpers
void feedbackKey;
void contactKey;
