// src/lib/api/logs.ts
import { apiFetch } from "./client";
import type { Direction, LogEntry } from "../types";

export interface GetLogsParams {
  barcode?: string;
  from?: string;
  to?: string;
}

export async function getLogs(params: GetLogsParams = {}): Promise<LogEntry[]> {
  const searchParams = new URLSearchParams();

  if (params.barcode) searchParams.set("barcode", params.barcode);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const query = searchParams.toString();
  const path = query ? `/logs?${query}` : "/logs";

  return apiFetch<LogEntry[]>(path);
}

export interface CreateLogPayload {
  barcode: string;
  direction: Direction;
  event_time?: string; // opzionale
}

export async function createLog(payload: CreateLogPayload): Promise<number> {
  // l’API Quart restituisce { message, id }
  const res = await apiFetch<{ message: string; id: number }>("/logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.id;
}

export async function deleteLog(id: number): Promise<void> {
  await apiFetch<unknown>(`/logs/${id}`, {
    method: "DELETE",
  });
}
