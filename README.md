# Sondaggi Parrocchia

App web per creare e gestire sondaggi: i gestori (autenticati) creano i sondaggi e ne vedono i risultati, chiunque riceva il link può rispondere senza bisogno di account.

Stack: React + Vite, Firebase (Auth, Firestore, Hosting, Analytics). Progetto Firebase: **sondaggio-87457**. Il deploy su Firebase Hosting avviene automaticamente ad ogni push sul branch `main` tramite GitHub Actions.

## 1. Completare la configurazione su Firebase Console

Il progetto `sondaggio-87457` e la config web sono già impostati nel codice (`src/lib/firebase.js`). Restano da fare, su [console.firebase.google.com](https://console.firebase.google.com/project/sondaggio-87457):

1. **Authentication** → tab "Sign-in method" → abilita **Email/Password**.
2. **Authentication** → tab "Users" → aggiungi manualmente un utente (email + password) per ogni persona che dovrà gestire i sondaggi. Non esiste una registrazione pubblica: gli account dei gestori si creano solo da qui.
3. **Firestore Database** → crea il database, se non esiste già (modalità produzione, scegli una region es. `europe-west`).
4. **Project settings** → "Service accounts" → "Generate new private key". Scarica il file JSON: serve solo per permettere a GitHub Actions di fare il deploy (non va mai committato nel repo).

## 2. Configurare il repository GitHub

Nel repository, vai su **Settings → Secrets and variables → Actions → New repository secret** e crea:

| Secret | Valore |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | contenuto completo del file JSON scaricato al punto 1.4 |

Non servono altri secret: la config web Firebase (`apiKey`, `projectId`, ecc.) non è sensibile ed è già nel codice.

Il workflow [`.github/workflows/firebase-deploy.yml`](.github/workflows/firebase-deploy.yml) fa automaticamente, ad ogni push su `main`: build dell'app, deploy delle regole Firestore e deploy su Firebase Hosting.

## 3. Sviluppo locale

```bash
npm install
npm run dev
```

Per deployare manualmente da locale (richiede [Firebase CLI](https://firebase.google.com/docs/cli) e login con `firebase login`):

```bash
npm run build
firebase deploy
```

## Funzionalità

- **Login gestori** (`/login`): email/password, account creati a mano in Firebase Console.
- **Dashboard** (`/dashboard`): elenco sondaggi, copia link pubblico, apri/chiudi, modifica, elimina.
- **Creazione/modifica sondaggio** (`/sondaggi/nuovo`, `/sondaggi/:id/modifica`): titolo, descrizione, domande a scelta singola, scelta multipla o risposta libera.
- **Risultati** (`/sondaggi/:id/risultati`): conteggi e percentuali per le domande a scelta, elenco risposte per le domande libere.
- **Pagina pubblica di voto** (`/s/:id`): nessun login richiesto; il sondaggio è visibile e votabile solo se è "aperto". Il browser ricorda (via `localStorage`) di aver già votato per evitare doppi invii dallo stesso dispositivo.

## Modello dati Firestore

- `surveys/{surveyId}`: `title`, `description`, `questions[]`, `status` (`open`/`closed`), `createdBy`, `createdAt`.
- `surveys/{surveyId}/responses/{responseId}`: `answers` (mappa `questionId → valore`), `submittedAt`.

Le regole di sicurezza (`firestore.rules`) permettono lettura pubblica dei sondaggi e invio pubblico delle risposte, ma riservano la gestione dei sondaggi e la lettura delle risposte (risultati) ai soli utenti autenticati.
