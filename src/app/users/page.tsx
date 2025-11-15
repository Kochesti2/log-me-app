// src/app/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { getUsers, createUser, deleteUser } from "@/lib/api/users";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    barcode: "",
    nome: "",
    cognome: "",
  });

  const loadUsers = async () => {
    try {
      setLoadingList(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Errore caricamento utenti");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await createUser(form);
      setForm({ barcode: "", nome: "", cognome: "" });
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Errore salvataggio utente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (barcode: string) => {
    if (!window.confirm(`Eliminare utente ${barcode}?`)) return;
    try {
      await deleteUser(barcode);
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Errore eliminazione utente");
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Utenti</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Nuovo utente</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
        >
          <input
            name="barcode"
            placeholder="Barcode (13 cifre)"
            value={form.barcode}
            onChange={handleChange}
          />
          <input
            name="nome"
            placeholder="Nome"
            value={form.nome}
            onChange={handleChange}
          />
          <input
            name="cognome"
            placeholder="Cognome"
            value={form.cognome}
            onChange={handleChange}
          />
          <button type="submit" disabled={saving}>
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </form>
        {error && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
        )}
      </section>

      <section>
        <h2>Lista utenti</h2>
        {loadingList ? (
          <p>Caricamento...</p>
        ) : users.length === 0 ? (
          <p>Nessun utente trovato.</p>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Nome</th>
                <th>Cognome</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.barcode}>
                  <td>{u.barcode}</td>
                  <td>{u.nome}</td>
                  <td>{u.cognome}</td>
                  <td>
                    <button onClick={() => handleDelete(u.barcode)}>
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
