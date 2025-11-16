// src/app/logs/page.tsx
'use client';

import { IconDoorEnter, IconDoorExit } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import type { Direction, LogEntry } from '@/lib/types';
import { createLog, deleteLog, getLogs } from '@/lib/api/logs';
import { FieldGroup, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Item } from '@/components/ui/item';
import dayjs from 'dayjs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:5000/ws/logs';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    barcode: string;
    direction: Direction;
  }>({
    barcode: '',
    direction: 'INBOUND',
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoadingList(true);
      setError(null);
      const data = await getLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Errore caricamento log');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    // primo caricamento
    void loadLogs();

    // connessione websocket
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket logs connesso');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'logs_changed') {
          console.log('Notifica logs_changed, ricarico lista log');
          void loadLogs();
        }
      } catch (err) {
        console.error('Errore parsing messaggio WS:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    ws.onclose = () => {
      console.log('WebSocket logs chiuso');
    };

    // cleanup
    return () => {
      ws.close();
    };
  }, [loadLogs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value as any,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createLog(form);
      setForm({ barcode: '', direction: 'INBOUND' });
      // opzionale: potresti anche non ricaricare qui, dato che il trigger/WS lo farà
      await loadLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Errore creazione log');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Eliminare log ${id}?`)) return;
    try {
      await deleteLog(id);
      await loadLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Errore eliminazione log');
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Ultimi LOG</FieldLegend>
          <FieldSeparator />
          <Item variant="outline">
            {loadingList ? (
              <p>Caricamento...</p>
            ) : logs.length === 0 ? (
              <p>Nessun log.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Event Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.id}</TableCell>
                        <TableCell>{l.barcode}</TableCell>
                        {l.direction === 'INBOUND' ? <IconDoorEnter /> : <IconDoorExit />}
                        <TableCell>{dayjs(l.event_time).format('HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Item>
        </FieldSet>
      </FieldGroup>
    </main>
  );
}
