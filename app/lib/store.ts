"use client";

import { clearSessionHintCookie, setSessionHintCookie } from "@/app/lib/auth/session-hint";
import type { UserDisplayPreferences } from "@/app/lib/display-preferences";
import { getExample } from "@/app/lib/examples";
import { handleError, normalizeHandle, RESERVED_HANDLES } from "@/app/lib/handles";
import { createClient } from "@/app/lib/supabase/client";
import {
  portfolioToRowPatch,
  rowToAccount,
  rowToPortfolio,
  type PageRow,
  type UserRow,
} from "@/app/lib/supabase/map-page";
import type { Account, Onboarding, Portfolio } from "@/app/lib/types";

const ADMIN_PAGE_SIZE = 200;
const PAGE_SELECT =
  "id, account_id, handle, display_name, published, content, created_at, updated_at";

type StoreState = {
  ready: boolean;
  sessionId: string | null;
  account: Account | null;
  pages: Portfolio[];
  activePageId: string | null;
  allPages: Portfolio[];
  allAccounts: Account[];
  adminListsComplete: boolean;
  sidebarCollapsed: boolean;
  publicByHandle: Record<string, Portfolio | null>;
};

const listeners = new Set<() => void>();

let state: StoreState = {
  ready: false,
  sessionId: null,
  account: null,
  pages: [],
  activePageId: null,
  allPages: [],
  allAccounts: [],
  adminListsComplete: true,
  sidebarCollapsed: true,
  publicByHandle: {},
};

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  emit();
}

export function emptyOnboarding(): Onboarding {
  return {
    step: 1,
    finished: false,
    source: null,
    instagram: "",
    website: "",
    sourceNote: "",
    sections: [],
    fontId: "sans",
    marks: { start: "open", profile: "open", sections: "open", look: "open", link: "open" },
  };
}

export function subscribeStore(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function isStoreReady() {
  return state.ready;
}

export function getSessionId() {
  return state.sessionId;
}

export function getActivePageId() {
  return state.activePageId;
}

export function getSidebarCollapsed() {
  return state.sidebarCollapsed;
}

export function setSidebarCollapsed(collapsed: boolean) {
  setState({ sidebarCollapsed: collapsed });
}

export const EMPTY_PAGES: Portfolio[] = [];

export function readSessionPages(): Portfolio[] {
  return state.pages.length ? state.pages : EMPTY_PAGES;
}

export function readSessionPage(): Portfolio | null {
  if (!state.sessionId) return null;
  return getPageForAccount(state.sessionId);
}

export function readSessionAccount(): Account | null {
  return state.account;
}

export function isSessionAdmin() {
  return state.account?.isAdmin === true;
}

export function getAccount(accountId: string) {
  if (state.account?.id === accountId) return state.account;
  return state.allAccounts.find((item) => item.id === accountId) ?? null;
}

export function getPagesForAccount(accountId: string) {
  if (state.sessionId === accountId) return state.pages;
  return state.allPages.filter((page) => page.accountId === accountId);
}

export function getPageForAccount(accountId: string) {
  const pages = getPagesForAccount(accountId);
  if (pages.length === 0) return null;
  return pages.find((page) => page.id === state.activePageId) ?? pages[0];
}

export function listAllPages(): Portfolio[] {
  return state.allPages;
}

/** Admin „Linki”: tikai pēc pabeigta onboarding (procesā esošie rādās kā melnraksts DB, ne sarakstā). */
export function isAdminListedLink(page: Portfolio) {
  return page.onboarding?.finished === true;
}

let adminListedPagesSnap: Portfolio[] = EMPTY_PAGES;
let adminListedPagesKey = "";

export function listAdminListedPages(): Portfolio[] {
  const key = state.allPages
    .map((page) => `${page.id}:${page.onboarding?.finished === true ? "1" : "0"}:${page.updatedAt}`)
    .join("|");
  if (key === adminListedPagesKey) return adminListedPagesSnap;
  const next = state.allPages.filter(isAdminListedLink);
  adminListedPagesSnap = next.length ? next : EMPTY_PAGES;
  adminListedPagesKey = key;
  return adminListedPagesSnap;
}

export function listAllAccounts(): Account[] {
  return state.allAccounts;
}

export function isAdminListsComplete() {
  return state.adminListsComplete;
}

export function getPageByHandle(handle: string) {
  const normalized = normalizeHandle(handle);
  const example = getExample(normalized);
  if (example) return example;
  const fromSession = state.pages.find((page) => page.handle === normalized);
  if (fromSession) return fromSession;
  const fromAll = state.allPages.find((page) => page.handle === normalized);
  if (fromAll) return fromAll;
  if (normalized in state.publicByHandle) return state.publicByHandle[normalized];
  return null;
}

export function isHandleTaken(handle: string, ignorePageId?: string) {
  const normalized = normalizeHandle(handle);
  if (RESERVED_HANDLES.has(normalized)) return true;
  const match = [...state.pages, ...state.allPages, ...Object.values(state.publicByHandle).filter(Boolean) as Portfolio[]].find(
    (page) => page.handle === normalized && page.id !== ignorePageId,
  );
  return Boolean(match);
}

export async function checkHandleAvailable(handle: string) {
  const normalized = normalizeHandle(handle);
  if (RESERVED_HANDLES.has(normalized)) return false;
  if (isHandleTaken(normalized)) return false;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("is_handle_available", { p_handle: normalized });
  if (error) return !isHandleTaken(normalized);
  return Boolean(data);
}

/** Vecāks Instagram imports lika profila bildi galerijā. Tā pieder avataram. */
export function claimInstagramAvatar(page: Portfolio): Portfolio {
  if (page.onboarding?.source !== "instagram" || page.avatarUrl || !page.gallery?.length) return page;
  const [avatarUrl, ...gallery] = page.gallery;
  const dropSection = gallery.length === 0;
  return {
    ...page,
    avatarUrl,
    gallery,
    sections: dropSection ? page.sections?.filter((id) => id !== "instagram") : page.sections,
    onboarding: page.onboarding
      ? {
          ...page.onboarding,
          sections: dropSection ? page.onboarding.sections.filter((id) => id !== "instagram") : page.onboarding.sections,
        }
      : page.onboarding,
  };
}

function unusedHandle() {
  return `lapa${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

async function fetchUserPages(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pages")
    .select(PAGE_SELECT)
    .eq("account_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as PageRow[]).map(rowToPortfolio);
}

async function fetchAdminLists(isAdmin: boolean, offset = 0) {
  if (!isAdmin) {
    return { pages: [] as Portfolio[], accounts: [] as Account[], complete: true };
  }
  const supabase = createClient();
  const end = offset + ADMIN_PAGE_SIZE - 1;
  // Speed H1: admin lists without heavy pages.content jsonb / data URLs.
  const [pagesRes, usersRes] = await Promise.all([
    supabase
      .from("pages")
      .select("id, account_id, handle, display_name, published, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .range(offset, end),
    supabase
      .from("users")
      .select(
        "id, email, name, is_admin, is_blocked, week_start_day, date_format, date_separator, time_format, timezone, last_seen_at, last_ip, last_country, active_page_id, created_at",
      )
      .order("created_at", { ascending: true })
      .range(offset, end),
  ]);
  if (pagesRes.error) throw pagesRes.error;
  if (usersRes.error) throw usersRes.error;
  const pages = ((pagesRes.data ?? []) as Omit<PageRow, "content">[]).map((row) =>
    rowToPortfolio({ ...row, content: null }),
  );
  const accounts = ((usersRes.data ?? []) as UserRow[]).map(rowToAccount);
  const complete =
    pages.length < ADMIN_PAGE_SIZE && accounts.length < ADMIN_PAGE_SIZE;
  return { pages, accounts, complete };
}

export async function loadMoreAdminLists(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!state.account?.isAdmin || state.adminListsComplete) return { ok: true };
  try {
    const offset = Math.max(state.allPages.length, state.allAccounts.length);
    const more = await fetchAdminLists(true, offset);
    const pageIds = new Set(state.allPages.map((page) => page.id));
    const accountIds = new Set(state.allAccounts.map((account) => account.id));
    setState({
      allPages: [
        ...state.allPages,
        ...more.pages.filter((page) => !pageIds.has(page.id)),
      ],
      allAccounts: [
        ...state.allAccounts,
        ...more.accounts.filter((account) => !accountIds.has(account.id)),
      ],
      adminListsComplete: more.complete,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Neizdevās ielādēt vairāk.",
    };
  }
}

export async function hydrateSession() {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getSession();
  const user = authData.session?.user ?? null;
  if (!user) {
    clearSessionHintCookie();
    setState({
      ready: true,
      sessionId: null,
      account: null,
      pages: [],
      activePageId: null,
      allPages: [],
      allAccounts: [],
      adminListsComplete: true,
    });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(
      "id, email, name, is_admin, is_blocked, week_start_day, date_format, date_separator, time_format, timezone, last_seen_at, last_ip, last_country, active_page_id, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  let userRow = profile as UserRow | null;
  if (profileError || !userRow) {
    const { data: ensured, error: ensureError } = await supabase.rpc("ensure_user_profile", {
      p_name: (user.user_metadata?.name as string | undefined) ?? "",
    });
    if (ensureError) {
      setState({ ready: true, sessionId: user.id, account: null, pages: [], activePageId: null });
      return;
    }
    userRow = ensured as UserRow;
  }

  const account = rowToAccount(userRow);
  if (account.isBlocked) {
    await supabase.auth.signOut();
    clearSessionHintCookie();
    setState({
      ready: true,
      sessionId: null,
      account: null,
      pages: [],
      activePageId: null,
      allPages: [],
      allAccounts: [],
      adminListsComplete: true,
    });
    return;
  }

  setSessionHintCookie();
  const pages = await fetchUserPages(user.id);
  const admin = await fetchAdminLists(account.isAdmin === true);
  const activePageId = userRow.active_page_id && pages.some((p) => p.id === userRow!.active_page_id)
    ? userRow.active_page_id
    : pages[0]?.id ?? null;

  setState({
    ready: true,
    sessionId: user.id,
    account,
    pages,
    activePageId,
    allPages: account.isAdmin ? admin.pages : pages,
    allAccounts: account.isAdmin ? admin.accounts : [account],
    adminListsComplete: account.isAdmin ? admin.complete : true,
  });

  void reportPresence();
}

/** Record last seen + IP/country for the signed-in user (server throttles writes). */
export async function reportPresence() {
  try {
    await fetch("/api/presence", { method: "POST", credentials: "same-origin" });
  } catch {
    /* ignore */
  }
}

export async function setAccountBlocked(
  accountId: string,
  blocked: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: accountId, blocked }),
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
  if (!response.ok || !payload?.ok) {
    return { ok: false, message: payload?.message ?? "Neizdevās mainīt pieeju." };
  }
  setState({
    allAccounts: state.allAccounts.map((item) =>
      item.id === accountId ? { ...item, isBlocked: blocked } : item,
    ),
  });
  return { ok: true };
}

export async function deleteAccountById(
  accountId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const response = await fetch("/api/admin/users", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: accountId }),
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
  if (!response.ok || !payload?.ok) {
    return { ok: false, message: payload?.message ?? "Neizdevās dzēst lietotāju." };
  }
  setState({
    allAccounts: state.allAccounts.filter((item) => item.id !== accountId),
    allPages: state.allPages.filter((page) => page.accountId !== accountId),
  });
  return { ok: true };
}

export async function setActivePageId(pageId: string) {
  setState({ activePageId: pageId });
  if (!state.sessionId) return;
  const supabase = createClient();
  await supabase.from("users").update({ active_page_id: pageId }).eq("id", state.sessionId);
}

export async function updateSessionAccountName(
  name: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, message: "Ievadi vārdu." };
  if (!state.sessionId || !state.account) return { ok: false, message: "Nav sesijas." };

  const supabase = createClient();
  const { error } = await supabase.from("users").update({ name: trimmed }).eq("id", state.sessionId);
  if (error) return { ok: false, message: error.message };

  await supabase.auth.updateUser({ data: { name: trimmed } });

  const account = { ...state.account, name: trimmed };
  setState({
    account,
    allAccounts: state.allAccounts.map((item) => (item.id === account.id ? { ...item, name: trimmed } : item)),
  });
  return { ok: true };
}

export async function saveSessionDisplayPreferences(
  prefs: UserDisplayPreferences,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!state.sessionId || !state.account) return { ok: false, message: "Nav sesijas." };
  const supabase = createClient();
  const { error } = await supabase.rpc("set_current_user_display_preferences", {
    p_week_start_day: prefs.weekStartDay,
    p_date_format: prefs.dateFormat,
    p_date_separator: prefs.dateSeparator,
    p_time_format: prefs.timeFormat,
    p_timezone: prefs.timezone,
  });
  if (error) return { ok: false, message: error.message };

  const account = {
    ...state.account,
    weekStartDay: prefs.weekStartDay,
    dateFormat: prefs.dateFormat,
    dateSeparator: prefs.dateSeparator,
    timeFormat: prefs.timeFormat,
    timezone: prefs.timezone,
  };
  setState({
    account,
    allAccounts: state.allAccounts.map((item) => (item.id === account.id ? account : item)),
  });
  return { ok: true };
}

export async function logoutAccount() {
  const supabase = createClient();
  await supabase.auth.signOut();
  setState({
    ready: true,
    sessionId: null,
    account: null,
    pages: [],
    activePageId: null,
    allPages: [],
    allAccounts: [],
  });
}

export async function createPageForAccount(accountId: string): Promise<Portfolio> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const handle = unusedHandle();
  const content = {
    bio: "",
    avatarUrl: null,
    themeId: "stamp",
    socials: [],
    blocks: [],
    onboarding: emptyOnboarding(),
  };
  const { data, error } = await supabase
    .from("pages")
    .insert({
      account_id: accountId,
      handle,
      display_name: state.account?.name ?? "",
      published: false,
      content,
    })
    .select(PAGE_SELECT)
    .single();
  if (error) throw error;
  const page = rowToPortfolio(data as PageRow);
  const pages = [...state.pages, page];
  setState({
    pages,
    activePageId: page.id,
    allPages: state.account?.isAdmin ? [page, ...state.allPages.filter((item) => item.id !== page.id)] : pages,
  });
  await supabase.from("users").update({ active_page_id: page.id }).eq("id", accountId);
  return page;
}

export async function savePage(page: Portfolio) {
  const supabase = createClient();
  const patch = portfolioToRowPatch({ ...page, updatedAt: new Date().toISOString() });
  const { data, error } = await supabase
    .from("pages")
    .update(patch)
    .eq("id", page.id)
    .select(PAGE_SELECT)
    .single();
  if (error) throw error;
  const saved = rowToPortfolio(data as PageRow);
  const pages = state.pages.map((item) => (item.id === saved.id ? saved : item));
  const allPages = state.allPages.map((item) => (item.id === saved.id ? saved : item));
  setState({
    pages: state.sessionId === saved.accountId ? pages : state.pages,
    allPages: state.account?.isAdmin ? allPages : pages,
  });
}

export async function deletePageById(pageId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("pages").delete().eq("id", pageId);
  if (error) throw error;
  const pages = state.pages.filter((page) => page.id !== pageId);
  const allPages = state.allPages.filter((page) => page.id !== pageId);
  const activePageId = state.activePageId === pageId ? pages[0]?.id ?? null : state.activePageId;
  setState({ pages, allPages, activePageId });
  if (state.sessionId && activePageId !== state.activePageId) {
    await supabase.from("users").update({ active_page_id: activePageId }).eq("id", state.sessionId);
  }
}

export async function setPagePublished(pageId: string, published: boolean) {
  const page = [...state.pages, ...state.allPages].find((item) => item.id === pageId);
  if (!page) return;
  await savePage({ ...page, published, updatedAt: new Date().toISOString() });
}

export async function loadPublicPage(handle: string): Promise<Portfolio | null> {
  const normalized = normalizeHandle(handle);
  const example = getExample(normalized);
  if (example) return example;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pages")
    .select(PAGE_SELECT)
    .eq("handle", normalized)
    .maybeSingle();
  if (error || !data) {
    setState({ publicByHandle: { ...state.publicByHandle, [normalized]: null } });
    return null;
  }
  const page = rowToPortfolio(data as PageRow);
  setState({ publicByHandle: { ...state.publicByHandle, [normalized]: page } });
  return page;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  handle: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const requested = normalizeHandle(input.handle);
  let handle = requested || unusedHandle();

  if (name.length < 2) return { ok: false, message: "Ievadi vārdu." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Ievadi derīgu e-pastu." };
  }
  if (input.password.length < 8) {
    return { ok: false, message: "Parolei jābūt vismaz 8 simboliem." };
  }
  if (requested) {
    const invalidHandle = handleError(requested);
    if (invalidHandle) return { ok: false, message: invalidHandle };
  }

  const available = await checkHandleAvailable(handle);
  if (!available) {
    if (requested) return { ok: false, message: "Šis links jau ir aizņemts." };
    handle = unusedHandle();
  }

  const supabase = createClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { name } },
  });
  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already")) {
      return { ok: false, message: "Šāds e-pasts jau ir reģistrēts." };
    }
    return { ok: false, message: signUpError.message };
  }
  const user = signUpData.user;
  if (!user) return { ok: false, message: "Neizdevās izveidot kontu." };
  if (!signUpData.session) {
    return {
      ok: false,
      message: "Konts izveidots. Apstiprini e-pastu un tad pieslēdzies.",
    };
  }

  const { error: profileError } = await supabase.rpc("ensure_user_profile", { p_name: name });
  if (profileError) return { ok: false, message: profileError.message };

  const content = {
    bio: "",
    avatarUrl: null,
    themeId: "stamp",
    socials: [],
    blocks: [],
  };
  const { data: pageRow, error: pageError } = await supabase
    .from("pages")
    .insert({
      account_id: user.id,
      handle,
      display_name: name,
      published: false,
      content,
    })
    .select(PAGE_SELECT)
    .single();
  if (pageError) return { ok: false, message: pageError.message };

  await supabase.from("users").update({ active_page_id: pageRow.id, name }).eq("id", user.id);
  await hydrateSession();
  return { ok: true };
}

async function postAuthLockout(
  action: "check" | "fail" | "clear",
  email: string,
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  try {
    const response = await fetch("/api/auth/lockout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action, email }),
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      retryAfterSec?: number;
    } | null;
    if (payload?.ok === false && payload.retryAfterSec) {
      return { ok: false, retryAfterSec: payload.retryAfterSec };
    }
    return { ok: response.ok && payload?.ok !== false, retryAfterSec: payload?.retryAfterSec };
  } catch {
    return { ok: true };
  }
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<{ ok: true; needsMfa?: boolean } | { ok: false; message: string }> {
  const supabase = createClient();
  const normalizedEmail = email.trim().toLowerCase();
  const lock = await postAuthLockout("check", normalizedEmail);
  if (!lock.ok && lock.retryAfterSec) {
    return {
      ok: false,
      message: `Pārāk daudz neveiksmīgu mēģinājumu. Mēģini pēc ${lock.retryAfterSec} s.`,
    };
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) {
    const fail = await postAuthLockout("fail", normalizedEmail);
    if (!fail.ok && fail.retryAfterSec) {
      return {
        ok: false,
        message: `Pārāk daudz neveiksmīgu mēģinājumu. Mēģini pēc ${fail.retryAfterSec} s.`,
      };
    }
    const banned =
      /banned|blocked|disabled|forbid/i.test(error.message) ||
      error.code === "user_banned";
    if (banned) {
      return {
        ok: false,
        message: "Pieeja sistēmai ar šo e-pastu ir liegta.",
      };
    }
    return { ok: false, message: "Nepareizs e-pasts vai parole." };
  }
  await postAuthLockout("clear", normalizedEmail);
  await hydrateSession();
  if (!state.sessionId) {
    return {
      ok: false,
      message: "Pieeja sistēmai ar šo e-pastu ir liegta.",
    };
  }

  let needsMfa = false;
  try {
    const { data } = await supabase.auth.mfa.listFactors();
    needsMfa = Boolean(
      (data?.totp ?? []).find((item: { status: string }) => item.status === "verified"),
    );
  } catch {
    needsMfa = false;
  }

  return { ok: true, needsMfa };
}

export function bindAuthListener() {
  const supabase = createClient();
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      clearSessionHintCookie();
      setState({
        ready: true,
        sessionId: null,
        account: null,
        pages: [],
        activePageId: null,
        allPages: [],
        allAccounts: [],
        adminListsComplete: true,
      });
      return;
    }
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
      void hydrateSession();
    }
  });
  return () => data.subscription.unsubscribe();
}
