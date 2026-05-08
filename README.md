[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Ew36zBjj)
# Webfejlesztési keretrendszerek — Projektmunka

> **Hallgató neve:** Csernák Hunor  
> **Neptun kód:** PQHY4Z  
> **Projekt téma:** Étkezéskövető alkalmazás  
> **Keretrendszer:** Angular (v21) — TypeScript

---

## 🚀 A projekt indítása (lokális futtatás)

```bash
git clone https://github.com/webfejlesztesi-keretrendszerek-2026/projektmunka-hunor843.git
cd etkezeskoveto_alkalmazas
npm install
npm run backend (külön terminál)
npm start (külön terminál)
```

---

## 🌐 Publikus URL

> Jelenleg nincs deployolt (publikus) URL.
Lokális futtatás: `http://localhost:4200/`

---

## 📁 Projekt struktúra

```
├── angular.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── db.json
├── .editorconfig
├── .prettierrc
├── docs/                    # Dokumentáció
│   ├── SPECIFICATION.md
│   ├── DATAMODEL.md
│   ├── COMPONENTS.md
│   └── AI_PROMPT_LOG.md
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.css
│   ├── environments/
│   └── app/
│       ├── app.config.ts
│       ├── app.css
│       ├── app.html
│       ├── app.routes.ts
│       ├── app.spec.ts
│       ├── app.ts
│       ├── toast.service.ts
│       ├── layout/
│       │   ├── header.component.css
│       │   ├── header.component.html
│       │   ├── header.component.ts
│       │   ├── footer.component.css
│       │   ├── footer.component.html
│       │   └── footer.component.ts
│       ├── models/
│       ├── services/
│       ├── state/
│       └── pages/
│           ├── home/
│           ├── login/
│           ├── forum/
│           ├── forum-topic-detail/
│           ├── settings/
│           ├── profile/
│           └── not-found/
```

---

## 📅 Mérföldkövek

| # | Tartalom | Határidő | Állapot |
|---|----------|----------|---------|
| 1 | Specifikáció, UI és megjelenés | 2026.03.29. 23:59 | ⬜ |
| 2 | Backend és adatok | 2026.04.26. 23:59 | ⬜ |
| 3 | Biztonság és tesztelés | 2026.05.10. 23:59 | ⬜ |

### Hogyan kérd az értékelést?

1. Commitold és push-old a munkádat a `main` vagy `master` branch-re
2. Menj a repód **Actions** fülére
3. Válaszd a **"Mérföldkő értékelés"** workflow-t
4. Kattints a **"Run workflow"** → válaszd ki a mérföldkövet → **"Run workflow"**
5. Az eredmény egy **GitHub Issue**-ban jelenik meg

> ⚠️ Mérföldkőnként **maximum 2 alkalommal** futtathatod az értékelést. Használd bölcsen!  
> ⚠️ A határidőkön automatikus értékelés is fut.

---

## ⚠️ Fontos

- A `.github/workflows/` könyvtár tartalmát **ne módosítsd**!
- A `docs/` mappába rakd a dokumentációs fájlokat.
- Az `AI_PROMPT_LOG.md` fájlt a `docs/` mappában vezesd.