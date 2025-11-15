// src/lib/api/users.ts
import { apiFetch } from "./client";
import type { User } from "../types";

export async function getUsers(): Promise<User[]> {
  return apiFetch<User[]>("/users");
}

export interface CreateUserPayload {
  barcode: string;
  nome: string;
  cognome: string;
}

export async function createUser(payload: CreateUserPayload): Promise<void> {
  await apiFetch<unknown>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(barcode: string): Promise<void> {
  await apiFetch<unknown>(`/users/${barcode}`, {
    method: "DELETE",
  });
}
