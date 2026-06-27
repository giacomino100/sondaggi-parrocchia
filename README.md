# Sondaggi Parrocchia

App web per creare e gestire sondaggi: i gestori (autenticati) creano i sondaggi e ne vedono i risultati, chiunque riceva il link può rispondere senza bisogno di account.

Stack: React + Vite, Firebase (Auth, Firestore, Hosting). Il deploy su Firebase Hosting avviene automaticamente ad ogni push sul branch `main` tramite GitHub Actions.

## 1. Creare il progetto Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e crea un nuovo progetto (es. `sondaggi-parrocchia`).
2. **Authentication** → tab "Sign-in method" → abilita **Email/Password**.
3. **Authentication** → tab "Users" → aggiungi manualmente un utente (email + password) per ogni persona che dovrà gestire i sondaggi. Non esiste una registrazione pubblica: gli account dei gestori si creano solo da qui.
4. **Firestore Database** → crea il database (modalità produzione, scegli una region es. `europe-west`).
5. **Project settings** (icona ingranaggio) → "Your apps" → aggiungi una **Web app**. Copia i valori di configurazione (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`): serviranno sia in locale che nei secret di GitHub.
6. **Project settings** → "Service accounts" → "Generate new private key". Scarica il file JSON: serve per permettere a GitHub Actions di fare il deploy.

## 2. Configurare il repository GitHub

Nel repository, vai su **Settings → Secrets and variables → Actions → New repository secret** e crea questi secret:

| Secret | Valore |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | dal config web Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | dal config web Firebase |
| `VITE_FIREBASE_PROJECT_ID` | dal config web Firebase (es. `sondaggi-parrocchia`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | dal config web Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | dal config web Firebase |
| `VITE_FIREBASE_APP_ID` | dal config web Firebase |
| `FIREBASE_SERVICE_ACCOUNT` | contenuto completo del file JSON scaricato al punto 6 |

Aggiorna anche `.firebaserc` in questo repo sostituendo `YOUR_FIREBASE_PROJECT_ID` con l'ID reale del progetto Firebase.

Il workflow [`.github/workflows/firebase-deploy.yml`](.github/workflows/firebase-deploy.yml) fa automaticamente, ad ogni push su `main`: build dell'app, deploy delle regole Firestore e deploy su Firebase Hosting.

## 3. Sviluppo locale

```bash
npm install
cp .env.example .env.local   # poi compila .env.local con i valori del config Firebase
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
