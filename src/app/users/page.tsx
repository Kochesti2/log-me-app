// src/app/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Ean, User } from '@/lib/types';
import { createUser, deleteUser, getNewEan, getUsers } from '@/lib/api/users';
import { Item } from '@/components/ui/item';
import { Field, FieldGroup, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEan, setNewEan] = useState<Ean | null>(null);

  const [form, setForm] = useState({
    barcode: '',
    nome: '',
    cognome: '',
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setNewEan(null);
        handelGetEan();
      };
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (newEan?.new_ean) {
      setForm((prev) => ({
        ...prev,
        barcode: newEan.new_ean,
      }));
    }
  }, [newEan]);

  const loadUsers = async () => {
    try {
      setLoadingList(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Errore caricamento utenti');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setSaving(true);
      setError(null);
      await createUser(form);
      setOpen(false);
      setForm({ barcode: '', nome: '', cognome: '' });
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Errore salvataggio utente');
      toast.error('Errore salvataggio utente');
    } finally {
      setSaving(false);
      toast.success('Operazione eseguita con successo!');
    }
  };

  const handleDelete = async (barcode: string) => {
    if (!window.confirm(`Eliminare utente ${barcode}?`)) return;
    try {
      await deleteUser(barcode);
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Errore eliminazione utente');
    }
  };

  const handelGetEan = async () => {
    try {
      const data = await getNewEan();
      setNewEan(data ?? null);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Errore, non si reisce a generare un ean nuovo');
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      {/*<h1>Utenti</h1>*/}

      {/*<section style={{ marginBottom: '2rem' }}>*/}
      {/*  <h2>Nuovo utente</h2>*/}
      {/*  <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>*/}
      {/*    <input*/}
      {/*      name="barcode"*/}
      {/*      placeholder="Barcode (13 cifre)"*/}
      {/*      value={form.barcode}*/}
      {/*      onChange={handleChange}*/}
      {/*    />*/}
      {/*    <input name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} />*/}
      {/*    <input*/}
      {/*      name="cognome"*/}
      {/*      placeholder="Cognome"*/}
      {/*      value={form.cognome}*/}
      {/*      onChange={handleChange}*/}
      {/*    />*/}
      {/*    <button type="submit" disabled={saving}>*/}
      {/*      {saving ? 'Salvataggio...' : 'Salva'}*/}
      {/*    </button>*/}
      {/*  </form>*/}
      {/*  {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}*/}
      {/*</section>*/}

      <FieldGroup style={{ marginTop: '20px', marginBottom: '60px' }}>
        <FieldSet>
          <FieldLegend>Nuovo Dipendente</FieldLegend>
          <FieldSeparator />
        </FieldSet>
        <Field orientation="horizontal">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" onClick={() => setOpen(true)}>
                Aggiungi +
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
              {/* Metti tutto dentro una form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Nuovo Dipendente</DialogTitle>
                  <DialogDescription>Iniziamo a censire il nuovo dipendente.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="nome-1">Nome</Label>
                    <Input id="name-1" name="nome" value={form.nome} onChange={handleChange} />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="cognome-1">Cognome</Label>
                    <Input
                      id="cognome-1"
                      name="cognome"
                      value={form.cognome}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="barcode-1">Barcode</Label>
                    <Input id="barcode-1" name="barcode" value={form.barcode} disabled={true} />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Chiudi
                    </Button>
                  </DialogClose>

                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvataggio...' : 'Salva'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Field>
      </FieldGroup>

      <FieldGroup>
        <FieldSet>
          <FieldLegend>Lista Dipendenti</FieldLegend>
          <FieldSeparator />
          <Item variant="outline">
            {loadingList ? (
              <p>Caricamento...</p>
            ) : users.length === 0 ? (
              <p>Nessun utente trovato.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Barcode</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.barcode}>
                        <TableCell>{u.barcode}</TableCell>
                        <TableCell>{u.nome}</TableCell>
                        <TableCell>{u.cognome}</TableCell>
                        <TableCell>
                          <Button onClick={() => handleDelete(u.barcode)}>Elimina</Button>
                        </TableCell>
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
