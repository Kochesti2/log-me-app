// src/lib/api/users.ts
import { apiFetch } from './client';
import type { Ean, User } from '../types';

export async function getUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users');
}

export interface CreateUserPayload {
  barcode: string;
  nome: string;
  cognome: string;
  email: string;
}

export async function createUser(payload: CreateUserPayload): Promise<void> {
  await apiFetch<unknown>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(barcode: string): Promise<void> {
  await apiFetch<unknown>(`/users/${barcode}`, {
    method: 'DELETE',
  });
}

export async function sendBarcodeToUser(barcode: string, email: string): Promise<void> {
  await apiFetch<unknown>('/users/send_barcode', {
    method: 'POST',
    body: JSON.stringify({ barcode: barcode, email: email }),
  });
}

export async function getNewEan(): Promise<Ean> {
  return await apiFetch<Ean>(`/users/newean`);
}
