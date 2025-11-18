// src/lib/types.ts
export interface User {
  barcode: string;
  nome: string;
  cognome: string;
}

export type Direction = 'CHECKIN' | 'CHECKOUT';

export interface LogEntry {
  id: number;
  barcode: string;
  direction: Direction;
  event_time: string; // ISO string dal server
}

export interface Ean {
  new_ean: string;
}
