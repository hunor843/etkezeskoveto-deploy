# Projekt struktúra

Ez a fájl egy gyors, kézi áttekintés a repó fontosabb részeiről. A lista a lényegi forrásfájlokra fókuszál; a tipikusan generált könyvtárak (`node_modules/`, `dist/`, `.angular/`) itt nem részei a fastruktúrának.

## Gyökér

- `angular.json` – Angular workspace konfiguráció
- `package.json` – scriptek és függőségek (`npm run backend`, `npm start`)
- `db.json` – `json-server` adatbázis (users, meals, forum, …)
- `server.js` – egyedi `json-server` middleware (backend oldali jogosultsági szabályok)
- `src/` – alkalmazás forráskód
- `public/` – statikus assetek
- `docs/` – specifikációk és dokumentáció

## Fastruktúra (rövid)

```text
.
├─ angular.json
├─ package.json
├─ db.json
├─ server.js
├─ src/
│  ├─ index.html
│  ├─ main.ts
│  ├─ styles.css
│  └─ app/
│     ├─ app.config.ts
│     ├─ app.routes.ts
│     ├─ app.html
│     ├─ app.css
│     ├─ app.ts
│     ├─ toast.service.ts
│     ├─ guards/
│     │  └─ auth.guard.ts
│     ├─ interceptors/
│     │  └─ auth.interceptor.ts
│     ├─ services/
│     │  └─ auth.service.ts
│     ├─ state/
│     │  └─ home-state.service.ts
│     ├─ layout/
│     │  ├─ header.component.*
│     │  └─ footer.component.*
│     └─ pages/
│        ├─ home/
│        ├─ login/
│        ├─ settings/
│        ├─ forum/
│        ├─ forum-topic-detail/
│        ├─ profile/
│        └─ not-found/
└─ docs/
   ├─ SPECIFICATION.md
   ├─ DATAMODEL.md
   ├─ COMPONENTS.md
   └─ AI_PROMPT_LOG.md
```

Megjegyzés: a repóban lehet `.vscode/` mappa is (lokális VS Code beállítások); ha publikáljátok, érdemes minimalizálni a benne lévő tartalmat.
