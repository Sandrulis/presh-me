"use client";

import { createClient } from "@/app/lib/supabase/client";

export const ADMIN_TODO_TITLE_MAX = 500;

export type AdminTodo = {
  id: string;
  title: string;
  isDone: boolean;
  completedAt: string | null;
  createdAt: string;
  sortOrder: number;
};

export function normalizeTodoTitle(value: string) {
  return value.trim().slice(0, ADMIN_TODO_TITLE_MAX);
}

type TodoRow = {
  id: string;
  title: string;
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
  sort_order: number;
};

function mapRow(row: TodoRow): AdminTodo {
  return {
    id: row.id,
    title: row.title,
    isDone: row.is_done,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
  };
}

function sortTodos(todos: AdminTodo[]) {
  return [...todos].sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    if (!a.isDone && !b.isDone) return a.sortOrder - b.sortOrder;
    return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
  });
}

export async function listAdminTodos(accountId: string): Promise<AdminTodo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("admin_todos")
    .select("*")
    .eq("account_id", accountId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return sortTodos((data as TodoRow[]).map(mapRow));
}

export async function addAdminTodo(accountId: string, title: string): Promise<AdminTodo[]> {
  const trimmed = normalizeTodoTitle(title);
  if (!trimmed) return listAdminTodos(accountId);
  const current = await listAdminTodos(accountId);
  const open = current.filter((item) => !item.isDone);
  const sortOrder = open.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  const supabase = createClient();
  await supabase.from("admin_todos").insert({
    account_id: accountId,
    title: trimmed,
    sort_order: sortOrder,
  });
  return listAdminTodos(accountId);
}

export async function renameAdminTodo(accountId: string, id: string, title: string): Promise<AdminTodo[]> {
  const trimmed = normalizeTodoTitle(title);
  if (!trimmed) return listAdminTodos(accountId);
  const supabase = createClient();
  await supabase.from("admin_todos").update({ title: trimmed }).eq("id", id).eq("account_id", accountId);
  return listAdminTodos(accountId);
}

export async function setAdminTodoDone(accountId: string, id: string, done: boolean): Promise<AdminTodo[]> {
  const supabase = createClient();
  await supabase
    .from("admin_todos")
    .update({
      is_done: done,
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("account_id", accountId);
  return listAdminTodos(accountId);
}

export async function reorderAdminTodos(accountId: string, ids: string[]): Promise<AdminTodo[]> {
  const supabase = createClient();
  await Promise.all(
    ids.map((id, index) =>
      supabase.from("admin_todos").update({ sort_order: index }).eq("id", id).eq("account_id", accountId),
    ),
  );
  return listAdminTodos(accountId);
}

export async function deleteAdminTodo(accountId: string, id: string): Promise<AdminTodo[]> {
  const supabase = createClient();
  await supabase.from("admin_todos").delete().eq("id", id).eq("account_id", accountId);
  return listAdminTodos(accountId);
}

export function formatTodoCompletedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}
