# log-me-app

Frontend web del sistema **logme** (rilevazione presenze tramite barcode: CHECKIN / CHECKOUT).
Applicazione Next.js che mostra i log di ingresso/uscita in tempo reale e permette ai manager autenticati di gestire i dipendenti.

---

## 1. Panoramica

Funzionalità (dal codice in `src/app/`):

| Pagina | Path | Accesso | Cosa fa |
|---|---|---|---|
| Home | `/` | — | Redirect permanente a `/logs` (`next.config.ts`) |
| Log | `/logs` | pubblica | Elenco timbrature, inserimento manuale e cancellazione (queste ultime richiedono login lato backend), aggiornamento live via WebSocket |
| Dipendenti | `/users` | login richiesto | Elenco, creazione (con generazione EAN-13), cancellazione, invio barcode via email |
| Login | `/auth/login` | pubblica | Login manager, salva il JWT in `localStorage` |
| Registrazione | `/auth/register` | pubblica | Registra un manager (creato **non attivo**: va attivato da un admin a DB) |

Ruolo nel sistema:

```
  lettore barcode                                    browser
       │                                                │
       ▼                                                ▼
  ┌─────────┐   INSERT INTO log    ┌──────────────┐  HTTP REST + WS  ┌──────────────┐
  │ clogger │ ───────────────────► │  PostgreSQL  │ ◄──────────────  │   logMeBE    │ ◄──── log-me-app
  │  (C++)  │                      │ (trigger     │  LISTEN/NOTIFY   │ (Python/     │      (questo
  └─────────┘                      │  NOTIFY)     │ ───────────────► │  Quart :5000)│       modulo, :3000)
                                   └──────────────┘                  └──────────────┘
```

- **log-me-app NON accede al database.** Tutti i dati passano dalle API REST di `logMeBE` (`NEXT_PUBLIC_API_BASE_URL`) e dal WebSocket `/ws/logs` (`NEXT_PUBLIC_WS_URL`).
- `clogger` scrive direttamente nella tabella `log`; un trigger PostgreSQL emette una `NOTIFY`, `logMeBE` la riceve e invia `{"type":"logs_changed"}` ai client WebSocket; la pagina `/logs` allora ricarica l'elenco.

## 2. Stack e prerequisiti

| Componente | Versione (da `package.json` / `package-lock.json`) |
|---|---|
| Node.js | **>= 20.9.0** (requisito di `next@16.0.3`) |
| npm | quello incluso in Node (il repo ha `package-lock.json`, usare `npm ci`) |
| Next.js | 16.0.3 (App Router, React Compiler attivo via `babel-plugin-react-compiler`) |
| React / React DOM | 19.2.0 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 4.1.17 (+ componenti shadcn/ui, `components.json`) |

Pacchetti di sistema: `git`, Node.js >= 20.9 (es. Node 20 LTS o 22 LTS da NodeSource o nvm). Opzionali: `nginx` (reverse proxy), `pm2` o systemd per l'avvio come servizio.

Dipendenze di runtime esterne: un'istanza di **logMeBE** raggiungibile dal **browser** dell'utente (non solo dal server).

## 3. Struttura del progetto

```
log-me-app/
├── next.config.ts          # redirect / -> /logs, reactCompiler
├── package.json            # script dev/build/start/lint
├── src/
│   ├── app/                # pagine (App Router): layout.tsx, logs/, users/, auth/login, auth/register
│   ├── context/AuthContext.tsx   # stato login, token in localStorage, protezione route lato client
│   ├── lib/api/            # client.ts (fetch + Bearer token), auth.ts, logs.ts, users.ts
│   ├── lib/types.ts        # tipi User, LogEntry, Ean
│   └── components/         # form auth, NewUser, componenti UI (shadcn)
├── public/                 # asset statici
├── test-post-users.js      # script manuale di test API (login + POST /users)
└── test-delete-user.js     # script manuale di test API (DELETE /users)
```

## 4. Installazione su server Linux

> Tutte le pagine sono componenti client (`'use client'`), ma l'app è servita con `next start` (server Node). Non è configurato `output: 'export'`.

### 4.1 Utente e Node.js

```bash
# utente dedicato senza shell di login
sudo useradd --system --create-home --home-dir /opt/logme --shell /usr/sbin/nologin logme

# Node.js 20 LTS (esempio Debian/Ubuntu con NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v   # deve essere >= 20.9.0
```

### 4.2 Clone e dipendenze

```bash
sudo -u logme git clone <URL_REPO_log-me-app> /opt/logme/log-me-app   # URL del repository: da verificare
sudo -u logme -H bash -c 'cd /opt/logme/log-me-app && npm ci'
```

> La home `/opt/logme` creata da `useradd` ha di norma permessi `700`/`750`: l'utente amministratore non può farci `cd`. Per questo i comandi sono eseguiti come `logme` con `sudo -u logme -H bash -c 'cd ... && ...'`.

### 4.3 Configurazione e build

Le variabili `NEXT_PUBLIC_*` vengono **incorporate nel bundle JavaScript al momento della build**: vanno impostate **prima** di `npm run build`. Se cambiano, occorre rifare la build.

```bash
sudo -u logme tee /opt/logme/log-me-app/.env.production.local >/dev/null <<'EOF'
NEXT_PUBLIC_API_BASE_URL=https://logme.example.com/api
NEXT_PUBLIC_WS_URL=wss://logme.example.com/api/ws/logs
EOF

sudo -u logme -H bash -c 'cd /opt/logme/log-me-app && npm run build'
```

### 4.4 Avvio manuale (prova)

```bash
sudo -u logme -H bash -c 'cd /opt/logme/log-me-app && npm run start'   # porta 3000 di default
# porta/indirizzo diversi:
sudo -u logme -H bash -c 'cd /opt/logme/log-me-app && npx next start -p 3000 -H 127.0.0.1'
```

### 4.5 Avvio come servizio (systemd)

`/etc/systemd/system/log-me-app.service`:

```ini
[Unit]
Description=logme frontend (Next.js)
After=network.target

[Service]
Type=simple
User=logme
WorkingDirectory=/opt/logme/log-me-app
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx next start -p 3000 -H 127.0.0.1
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now log-me-app
sudo systemctl status log-me-app
```

> `EnvironmentFile=` nel servizio **non basta** per le variabili `NEXT_PUBLIC_*`: sono lette in fase di build, non di avvio. Usare il file `.env.production.local` (o export) prima di `npm run build`.

Alternativa con pm2 (da eseguire come utente `logme`, nella cartella del progetto): `pm2 start npm --name log-me-app -- start && pm2 save && pm2 startup` (`pm2 startup` stampa un comando da lanciare con sudo).

### 4.6 Reverse proxy (nginx) — consigliato

Esempio che serve frontend e backend sotto lo stesso dominio. Il blocco WebSocket richiede gli header `Upgrade`/`Connection`.

```nginx
server {
    listen 443 ssl;
    server_name logme.example.com;
    # ssl_certificate / ssl_certificate_key ...

    # backend logMeBE (porta 5000), prefisso /api rimosso
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Con questa configurazione: `NEXT_PUBLIC_API_BASE_URL=https://logme.example.com/api` e `NEXT_PUBLIC_WS_URL=wss://logme.example.com/api/ws/logs`.
Ricordarsi di aggiungere l'origin del frontend alla lista CORS di logMeBE (vedi §7).

### 4.7 Aggiornamento

```bash
sudo -u logme -H bash -c 'cd /opt/logme/log-me-app && git pull && npm ci && npm run build'
sudo systemctl restart log-me-app
```

## 5. Variabili d'ambiente

Uniche variabili lette dal codice (`grep process.env`):

| Nome | Obbligatoria | Default | Descrizione | Esempio |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **sì** | nessuno (nell'app). Solo gli script `test-*.js` usano `http://localhost:5000` | URL base delle API REST di logMeBE, senza `/` finale. Usata in `src/lib/api/client.ts`. Se assente le chiamate vanno a `undefined/...` e falliscono | `http://192.168.1.10:5000` |
| `NEXT_PUBLIC_WS_URL` | consigliata | `ws://localhost:5000/ws/logs` | URL completo del WebSocket dei log (`src/app/logs/page.tsx`). Usare `wss://` se la pagina è in HTTPS | `ws://192.168.1.10:5000/ws/logs` |
| `PORT` | no | `3000` | Porta di `next start`/`next dev` (convenzione Next.js; in alternativa `-p`) | `3000` |
| `NODE_ENV` | no | impostata da Next | `production` per `next start` | `production` |

Entrambe le `NEXT_PUBLIC_*` sono **pubbliche**: finiscono nel JavaScript scaricato dal browser e devono essere raggiungibili dal client, non da `localhost` del server (salvo che browser e server coincidano).

File `.env` supportati da Next.js (caricati in ordine di priorità): `.env.production.local`, `.env.local`, `.env.production`, `.env`. Il `.gitignore` esclude solo `.env`: **non committare** `.env.local`/`.env.production.local` (aggiungerli al `.gitignore` se necessario).

Esempio `.env.production.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
NEXT_PUBLIC_WS_URL=ws://192.168.1.10:5000/ws/logs
```

Oppure con export prima della build (nella stessa shell che lancia la build: `sudo -u logme ...` non conserva le variabili esportate dall'utente chiamante):

```bash
export NEXT_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
export NEXT_PUBLIC_WS_URL=ws://192.168.1.10:5000/ws/logs
npm run build
```

## 6. Database

log-me-app **non si collega al database** e non ha migrazioni né credenziali DB. Legge e scrive i dati esclusivamente tramite le API di logMeBE.
Database (PostgreSQL), utenti, schema e migrazioni sono documentati nel README di `logMeBE` (`../logMeBE/README.md`, migrazioni in `../logMeBE/migrations/`).

Unico punto in cui il DB riguarda il frontend: i manager registrati da `/auth/register` vengono creati con `active = false` nella tabella `managers` e non possono fare login (HTTP 403) finché un amministratore non li attiva. Esempio (da eseguire sul DB di logMeBE):

```sql
UPDATE managers SET active = true WHERE username = 'mario';
```

Il backend accetta al massimo 10 manager (`../logMeBE/auth.py`).

## 7. Collegamento con gli altri moduli

### logMeBE (API)

Endpoint usati dal frontend (`src/lib/api/*.ts`):

| Metodo | Endpoint | Auth richiesta dal backend |
|---|---|---|
| POST | `/auth/login`, `/auth/register` | no |
| GET | `/logs?barcode=&from=&to=` | no |
| POST | `/logs` | Bearer JWT |
| DELETE | `/logs/{id}` | Bearer JWT |
| GET | `/users`, `/users/newean` | no |
| POST | `/users`, `/users/send_barcode` | Bearer JWT |
| DELETE | `/users/{barcode}` | Bearer JWT |
| WS | `/ws/logs` | no |

**Autenticazione**: `POST /auth/login` restituisce `{access_token, token_type}`. Il token è salvato in `localStorage` (`token`, `user`) e inviato come `Authorization: Bearer <token>` su tutte le chiamate tranne le `GET` che iniziano con `/logs` (`PUBLIC_ENDPOINTS` in `src/lib/api/client.ts`). Scadenza 24 h (`ACCESS_TOKEN_EXPIRE_MINUTES` in `../logMeBE/auth.py`); su 401 il frontend reindirizza a `/auth/login`. Il frontend non conosce la `SECRET_KEY`: nessun segreto condiviso da configurare qui.

**CORS**: le origin ammesse sono **hardcoded** in `../logMeBE/app.py`:

```python
allow_origin=["http://localhost:3000", "http://192.168.1.38:3000", "http://192.168.12.158:3000"]
```

Se il frontend è servito da un altro host/porta/dominio (es. `https://logme.example.com`), va aggiunto a questa lista e logMeBE va riavviato; altrimenti il browser blocca le chiamate. Se frontend e API sono sotto lo stesso dominio via reverse proxy (§4.6), le richieste sono same-origin e il CORS non interviene.

L'elenco `allow_origin` di `quart-cors` vale anche per l'header `Origin` delle connessioni WebSocket `/ws/logs` (comportamento della libreria, da verificare sulla versione installata): un'origin non ammessa può impedire l'aggiornamento live anche se le chiamate REST funzionano.

**WebSocket**: `NEXT_PUBLIC_WS_URL` deve puntare a `/ws/logs` di logMeBE. In HTTPS usare `wss://` (i browser bloccano `ws://` da pagine HTTPS).

### clogger

Nessun collegamento diretto: clogger scrive nel DB, il frontend vede i nuovi log tramite la notifica WebSocket di logMeBE.

## 8. Sviluppo e test

```bash
npm ci
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws/logs
EOF
npm run dev        # http://localhost:3000 (hot reload)
npm run lint       # ESLint (eslint.config.mjs)
npx prettier --check .   # formattazione (.prettierrc)
```

Test automatici: **nessuno** nel frontend (nessun framework di test in `package.json`).
Sono presenti due script manuali che chiamano direttamente l'API (richiedono logMeBE attivo e un manager `admin` / `admin!` attivo, credenziali hardcoded negli script):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000 node test-post-users.js
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000 node test-delete-user.js
```

## 9. Verifica, log e troubleshooting

Verifica:

```bash
curl -I http://127.0.0.1:3000/          # 308 -> /logs
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/logs   # 200
curl -s "$NEXT_PUBLIC_API_BASE_URL/logs" | head   # backend raggiungibile
```

Poi aprire `/logs` nel browser: la tabella deve popolarsi; una timbratura da clogger deve comparire senza ricaricare.

Log:
- servizio: `journalctl -u log-me-app -f` (pm2: `pm2 logs log-me-app`)
- errori di chiamata API/CORS/WebSocket: console del browser (DevTools), non nei log del server, perché le chiamate partono dal client.

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| Richieste a `undefined/logs` | `NEXT_PUBLIC_API_BASE_URL` non impostata in fase di build | Impostarla e rifare `npm run build` |
| Variabile cambiata ma nessun effetto | `NEXT_PUBLIC_*` incorporate in build | `npm run build` + restart |
| Errore CORS in console (o WebSocket rifiutato) | Origin del frontend non in `allow_origin` di logMeBE | Aggiungerla in `../logMeBE/app.py`, riavviare il backend |
| Chiamate verso `localhost:5000` falliscono da altri PC | URL puntano al localhost del client | Usare IP/hostname del server |
| Lista log non si aggiorna da sola | WS non connesso (URL errato, `ws://` da pagina HTTPS, proxy senza `Upgrade`) | Controllare `NEXT_PUBLIC_WS_URL` e config nginx |
| Login: 403 "Account is not active" | Manager non attivato | `UPDATE managers SET active = true ...` (§6) |
| Redirect continuo a `/auth/login` | Token scaduto (24 h) o `SECRET_KEY` del backend cambiata | Rifare login |
| `next build` fallisce su versione Node | Node < 20.9 | Aggiornare Node |

## 10. Note di sicurezza

- Le variabili `NEXT_PUBLIC_*` sono visibili a chiunque: **non** inserirvi segreti.
- Il JWT è in `localStorage`, quindi esposto a eventuali XSS: non introdurre HTML non sanificato.
- Servire il frontend e le API in **HTTPS** (reverse proxy con certificato, es. Let's Encrypt) e usare `wss://`: il token viaggia nell'header `Authorization`.
- La protezione delle pagine (`src/context/AuthContext.tsx`) è solo lato client; la sicurezza reale è data dai controlli `@auth_required` di logMeBE. Nota: `GET /users` e `GET /users/newean` **non** richiedono autenticazione nel backend (da valutare).
- Esporre all'esterno solo nginx (443); far ascoltare `next start` su `127.0.0.1`.
- File `.env*.local`: proprietario `logme`, permessi `600` (`chmod 600 .env.production.local`).
- Gli script `test-*.js` contengono credenziali di esempio (`admin` / `admin!`): non usare queste credenziali in produzione.
- Limitare la registrazione manager: chiunque raggiunga `/auth/register` può creare account (inattivi) fino al limite di 10.

## Da verificare

- URL del repository git per il clone.
- Hostname/IP e porte reali di produzione (gli IP `192.168.1.38` e `192.168.12.158` compaiono solo nella lista CORS del backend).
- Come viene avviato logMeBE in produzione: `app.py` ha solo `app.run()` (porta di default Quart 5000) e un commento `quart run -h 0.0.0.0 -p 5000`; la porta 5000 è assunta da default e commenti.
- Se `GET /users` debba essere pubblico.
