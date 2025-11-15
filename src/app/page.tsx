// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Timbrature dashboard</h1>
      <ul>
        <li>
          <Link href="/users">Gestione utenti</Link>
        </li>
        <li>
          <Link href="/logs">Log timbrature</Link>
        </li>
      </ul>
    </main>
  );
}
