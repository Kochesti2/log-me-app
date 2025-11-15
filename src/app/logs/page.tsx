// src/app/logs/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type { LogEntry, Direction } from "@/lib/types";
import { getLogs, createLog, deleteLog } from "@/lib/api/logs";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:5000/ws/logs";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    barcode: string;
    direction: Direction;
  }>({
    barcode: "",
    direction: "INBOUND",
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoadingList(true);
      setError(null);
      const data = await getLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Errore caricamento log");
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
      console.log("WebSocket logs connesso");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "logs_changed") {
          console.log("Notifica logs_changed, ricarico lista log");
          void loadLogs();
        }
      } catch (err) {
        console.error("Errore parsing messaggio WS:", err);
      }
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
    };

    ws.onclose = () => {
      console.log("WebSocket logs chiuso");
    };

    // cleanup
    return () => {
      ws.close();
    };
  }, [loadLogs]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      setForm({ barcode: "", direction: "INBOUND" });
      // opzionale: potresti anche non ricaricare qui, dato che il trigger/WS lo farà
      await loadLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Errore creazione log");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Eliminare log ${id}?`)) return;
    try {
      await deleteLog(id);
      await loadLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Errore eliminazione log");
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Log timbrature</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Nuova timbratura</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
        >
          <input
            name="barcode"
            placeholder="Barcode"
            value={form.barcode}
            onChange={handleChange}
          />
          <select
            name="direction"
            value={form.direction}
            onChange={handleChange}
          >
            <option value="INBOUND">INBOUND</option>
            <option value="OUTBOUND">OUTBOUND</option>
          </select>
          <button type="submit">Registra</button>
        </form>
        {error && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
        )}
      </section>

      <section>
        <h2>Ultime timbrature</h2>
        {loadingList ? (
          <p>Caricamento...</p>
        ) : logs.length === 0 ? (
          <p>Nessun log.</p>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Barcode</th>
                <th>Direction</th>
                <th>Event Time</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.barcode}</td>
                  <td>{l.direction}</td>
                  <td>{l.event_time}</td>
                  <td>
                    <button onClick={() => handleDelete(l.id)}>
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}